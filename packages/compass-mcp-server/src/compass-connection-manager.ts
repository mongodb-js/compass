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

export interface CompassConnectionManagerOptions {
  /**
   * Returns the decrypted connection string and display name for a given
   * Compass connection ID, or undefined if the ID is unknown.
   */
  getConnectionInfo: (id: string) => Promise<ResolvedConnection | undefined>;

  /**
   * Returns the current MCP access consent state for a connection.
   * 'ask' means no decision has been stored yet.
   */
  checkConsent: (id: string) => Promise<ConsentState>;

  /**
   * Called when consent state is 'ask'. Presents a UI prompt to the user.
   */
  requestConsentFromUI: (
    id: string,
    name: string
  ) => Promise<{ decision: ConsentDecision; remember: boolean }>;

  /**
   * Persists a consent decision back to the connection's storage record.
   */
  saveConsent: (id: string, decision: ConsentDecision) => Promise<void>;
}

/**
 * ConnectionManager implementation that uses Compass's stored connections.
 *
 * The connect() method treats settings.connectionString as a Compass
 * connection ID (not a raw MongoDB URI). It resolves the real connection string
 * from Compass's connection storage and runs the per-connection consent flow
 * before establishing the MongoClient.
 */
export class CompassConnectionManager extends ConnectionManager {
  private readonly opts: CompassConnectionManagerOptions;
  private provider: NodeDriverServiceProvider | null = null;

  constructor(opts: CompassConnectionManagerOptions) {
    super();
    this.opts = opts;
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

    // Consent check — may show a Compass dialog if not yet decided.
    const consent = await this.opts.checkConsent(connectionId);
    let decision: ConsentDecision;
    if (consent === 'ask') {
      const result = await this.opts.requestConsentFromUI(
        connectionId,
        resolved.displayName
      );
      decision = result.decision;
      if (result.remember) {
        await this.opts.saveConsent(connectionId, decision);
      }
    } else {
      decision = consent;
    }

    if (decision === 'denied') {
      return this.changeState('connection-error', {
        tag: 'errored',
        errorReason: `Access to connection "${resolved.displayName}" was denied`,
      });
    }

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
    return this.changeState('connection-close', { tag: 'disconnected' });
  }

  override async close(): Promise<void> {
    await this.disconnect();
    this._events.emit('close', this.currentConnectionState);
  }
}
