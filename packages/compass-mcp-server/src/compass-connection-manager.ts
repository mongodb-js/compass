import {
  ConnectionManager,
  ConnectionStateConnected,
  type AnyConnectionState,
  type ConnectionSettings,
  type ConnectionStateDisconnected,
} from 'mongodb-mcp-server';
import { NodeDriverServiceProvider } from '@mongosh/service-provider-node-driver';
import { isAtlasStream } from 'mongodb-build-info';
import ConnectionString from 'mongodb-connection-string-url';
import type { McpAccess, McpPreset } from '@mongodb-js/connection-info';

/**
 * A resolved Compass connection — connection string with secrets already
 * decrypted and driver options ready for NodeDriverServiceProvider.
 */
export interface ResolvedConnection {
  connectionString: string;
  displayName: string;
}

export type ConsentDecision = 'allowed' | 'denied';
export type ConsentState = ConsentDecision | 'ask';

/**
 * User's response from the consent dialog. `access` carries the full policy
 * including preset when allowed.
 */
export type ConsentResult = {
  access: { mode: 'allowed'; preset: McpPreset } | { mode: 'denied' };
  remember: boolean;
};

export interface CompassConnectionManagerOptions {
  /**
   * Returns the decrypted connection string and display name for a given
   * Compass connection ID, or undefined if the ID is unknown.
   */
  getConnectionInfo: (id: string) => Promise<ResolvedConnection | undefined>;

  /**
   * Returns the stored MCP access policy for a connection. `{ mode: 'ask' }`
   * means no decision has been stored yet — the manager will prompt the user
   * via `requestAccessFromUI`.
   */
  checkAccess: (id: string) => Promise<McpAccess>;

  /**
   * Called when `checkAccess` returns `{ mode: 'ask' }`. Presents the UI
   * preset picker and returns the user's choice plus whether to remember it.
   */
  requestAccessFromUI: (id: string, name: string) => Promise<ConsentResult>;

  /**
   * Persists an access policy back to the connection's storage record.
   */
  saveAccess: (id: string, access: McpAccess) => Promise<void>;
}

/**
 * ConnectionManager implementation that uses Compass's stored connections.
 *
 * The connect() method treats settings.connectionString as a Compass
 * connection ID (not a raw MongoDB URI). It resolves the real connection
 * string from Compass's connection storage and runs the per-connection
 * consent flow before establishing the MongoClient. The resolved preset is
 * stored on the manager so the per-call enforcement gate can read it.
 */
export class CompassConnectionManager extends ConnectionManager {
  private readonly opts: CompassConnectionManagerOptions;
  private provider: NodeDriverServiceProvider | null = null;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private activePreset: McpPreset | undefined;

  constructor(opts: CompassConnectionManagerOptions) {
    super();
    this.opts = opts;
  }

  /** Preset for the currently-active connection, or undefined if none. */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  getActivePreset(): McpPreset | undefined {
    return this.activePreset;
  }

  override async connect(
    settings: ConnectionSettings
  ): Promise<AnyConnectionState> {
    const connectionId = settings.connectionString;

    const resolved = await this.opts.getConnectionInfo(connectionId);
    if (!resolved) {
      return this.changeState('connection-error', {
        tag: 'errored',
        errorReason: `No Compass connection found with id "${connectionId}"`,
      });
    }

    if (isAtlasStream(resolved.connectionString)) {
      return this.changeState('connection-error', {
        tag: 'errored',
        errorReason: 'MCP server does not support Atlas Stream connections',
      });
    }

    // Access check — may show a Compass dialog if not yet decided.
    const stored = await this.opts.checkAccess(connectionId);
    let effective: { mode: 'allowed'; preset: McpPreset } | { mode: 'denied' };
    if (stored.mode === 'ask') {
      const result = await this.opts.requestAccessFromUI(
        connectionId,
        resolved.displayName
      );
      effective = result.access;
      if (result.remember) {
        await this.opts.saveAccess(connectionId, result.access);
      }
    } else if (stored.mode === 'denied') {
      effective = { mode: 'denied' };
    } else {
      effective = { mode: 'allowed', preset: stored.preset };
    }

    if (effective.mode === 'denied') {
      return this.changeState('connection-error', {
        tag: 'errored',
        errorReason: `Access to connection "${resolved.displayName}" was denied`,
      });
    }

    this.activePreset = effective.preset;

    // Append a distinctive appName so MongoDB logs can identify MCP traffic.
    const uri = new ConnectionString(resolved.connectionString);
    const params = uri.typedSearchParams<{ appName?: string }>();
    const existing = params.get('appName') ?? '';
    if (!existing.includes('MCP')) {
      params.set(
        'appName',
        existing ? `${existing} (MCP)` : 'MongoDB Compass (MCP)'
      );
    }

    try {
      this.provider = await NodeDriverServiceProvider.connect(uri.toString(), {
        productName: 'MongoDB Compass',
        productDocsLink: 'https://www.mongodb.com/docs/compass/',
        timeoutMS: 30_000,
        readPreference: 'secondaryPreferred',
      });
      return this.changeState(
        'connection-success',
        new ConnectionStateConnected(this.provider)
      );
    } catch (err) {
      this.activePreset = undefined;
      return this.changeState('connection-error', {
        tag: 'errored',
        errorReason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  override async disconnect(): Promise<ConnectionStateDisconnected> {
    if (this.provider) {
      try {
        await this.provider.close();
      } catch {
        // Ignore close errors — connection may already be dead.
      }
      this.provider = null;
    }
    this.activePreset = undefined;
    return this.changeState('connection-close', { tag: 'disconnected' });
  }

  override async close(): Promise<void> {
    await this.disconnect();
    this._events.emit('close', this.currentConnectionState);
  }
}
