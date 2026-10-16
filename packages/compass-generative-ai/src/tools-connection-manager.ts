import {
  ConnectionManager,
  ConnectionEntry,
  ConnectionStateConnected,
  ErrorCodes,
  MongoDBError,
  type ConnectionRegistry,
  type ConnectionSettings,
  type ConnectionStateDisconnected,
} from '@mongodb-js/mcp-tools-mongodb';
import type { Keychain, LoggerBase } from '@mongodb-js/mcp-core';
import {
  NodeDriverServiceProvider,
  type DevtoolsConnectOptions,
} from '@mongosh/service-provider-node-driver';
import type { ServiceProvider } from '@mongosh/service-provider-core';
import { isAtlas, isAtlasStream } from 'mongodb-build-info';
import ConnectionString from 'mongodb-connection-string-url';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';

export interface ToolsConnectParams {
  connectionId: string;
  connectionString: string;
  connectOptions: DevtoolsConnectOptions;
}

export const DATABASE_TOOLS_TELEMETRY_APP_NAME = 'Database Tools';
const DEFAULT_TELEMETRY_APP_NAME = 'MongoDB Compass';

/**
 * The single connection handle Compass Database Tools expose to the MCP tools.
 * Compass drives the connection itself (see {@link ToolsConnectionManager}), so
 * the tools only ever need one opaque id to address it by.
 */
export const COMPASS_CONNECTION_ID = 'compass';

type ToolsConnectionManagerConfig = {
  logger: LoggerBase;
  getTelemetryAnonymousId: () => string;
};

export class ToolsConnectionManager extends ConnectionManager {
  private logger: LoggerBase;
  private getTelemetryAnonymousId: () => string;
  private activeConnection: {
    id: string;
    provider: ServiceProvider;
  } | null = null;

  constructor({
    logger,
    getTelemetryAnonymousId,
  }: ToolsConnectionManagerConfig) {
    super();
    this.logger = logger;
    this.getTelemetryAnonymousId = getTelemetryAnonymousId;
  }

  override connect(_settings?: ConnectionSettings): Promise<never> {
    // It shouldn't be possible for a user to get here because the connect tool
    // is not included. We also only include the database tools when there is a
    // relevant connection.
    return Promise.reject(
      new Error(
        // eslint-disable-next-line no-multi-str
        "Database Tools in MongoDB Compass makes use of the connection that MongoDB Compass is connected to. \
To connect, choose a connection from Compass's connection sidebar - https://www.mongodb.com/docs/compass/connect/"
      )
    );
  }

  override async disconnect(): Promise<ConnectionStateDisconnected> {
    try {
      await this.activeConnection?.provider?.close();
    } catch (error) {
      this.logger.error({
        id: mongoLogId(1_001_000_411),
        context: 'compass-tools-connection-manager',
        message: `Error disconnecting from Compass connection - ${
          error instanceof Error ? error.message : String(error)
        }`,
        attributes: {
          error: (error as any).stack,
        },
      });
    }

    this.activeConnection = null;
    return this.changeState('connection-close', {
      tag: 'disconnected',
    });
  }

  override async close(): Promise<void> {
    await this.disconnect();
    this._events.emit('close', this.currentConnectionState);
  }

  async connectToCompassConnection(
    connectParams: ToolsConnectParams
  ): Promise<void> {
    if (this.activeConnection) {
      throw new Error('Already connected to a Compass connection');
    }

    if (isAtlasStream(connectParams.connectionString)) {
      this.logger.warning({
        id: mongoLogId(1_001_000_413),
        context: 'compass-tools-connection-manager',
        message: 'Attempting a connection to an Atlas Stream.',
      });
      this.changeState('connection-error', {
        tag: 'errored',
        errorReason:
          'Database Tools does not support connecting to Atlas Streams',
      });
      return;
    }

    const { connectionId, connectOptions, connectionString } =
      this.overridePresetAppName(connectParams);
    try {
      const serviceProvider = await NodeDriverServiceProvider.connect(
        connectionString,
        {
          timeoutMS: 30_000,
          readPreference: 'secondaryPreferred',
          readConcern: {
            level: 'local',
          },
          ...connectOptions,
        }
      );
      this.activeConnection = {
        id: connectionId,
        provider: serviceProvider,
      };
      return void this.changeState(
        'connection-success',
        new ConnectionStateConnected({ serviceProvider })
      );
    } catch (error) {
      this.logger.error({
        id: mongoLogId(1_001_000_412),
        context: 'compass-tools-connection-manager',
        message: `Error connecting to Compass connection - ${
          error instanceof Error ? error.message : String(error)
        }`,
        attributes: {
          error: (error as any).stack,
        },
      });
      return void this.changeState('connection-error', {
        tag: 'errored',
        errorReason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  overridePresetAppName(connectParams: ToolsConnectParams): ToolsConnectParams {
    const connectionURL = new ConnectionString(connectParams.connectionString);
    const connectOptions: DevtoolsConnectOptions = {
      ...connectParams.connectOptions,
    };
    const searchParams =
      connectionURL.typedSearchParams<DevtoolsConnectOptions>();
    const appName = searchParams.get('appName');

    if (
      !appName ||
      (appName.startsWith(DEFAULT_TELEMETRY_APP_NAME) &&
        !appName.includes(DATABASE_TOOLS_TELEMETRY_APP_NAME))
    ) {
      const defaultAppName = `${DEFAULT_TELEMETRY_APP_NAME} ${DATABASE_TOOLS_TELEMETRY_APP_NAME}`;
      const telemetryAnonymousId = this.getTelemetryAnonymousId();
      const connectionId = connectParams.connectionId;
      const newAppName = isAtlas(connectParams.connectionString)
        ? `${defaultAppName}${
            telemetryAnonymousId ? `--${telemetryAnonymousId}` : ''
          }--${connectionId}`
        : defaultAppName;

      searchParams.set('appName', newAppName);
      connectOptions.appName = newAppName;
    }

    return {
      connectionId: connectParams.connectionId,
      connectionString: connectionURL.toString(),
      connectOptions,
    };
  }
}

/**
 * A {@link ConnectionRegistry} view over the single Compass connection.
 *
 * mongodb-mcp-server v3 resolves every MongoDB tool call through a connection
 * registry keyed by an opaque `connectionId`, but Compass owns its connection
 * lifecycle (the user's sidebar connection) and only ever has one live at a
 * time. This adapter exposes that connection under
 * {@link COMPASS_CONNECTION_ID} so the tools can resolve it without Compass
 * having to run the library's connection store.
 */
export class ToolsConnectionRegistry implements ConnectionRegistry {
  private readonly entry: ConnectionEntry;

  constructor(connectionManager: ToolsConnectionManager, keychain: Keychain) {
    this.entry = new ConnectionEntry({
      connectionId: COMPASS_CONNECTION_ID,
      name: COMPASS_CONNECTION_ID,
      source: 'explicit',
      manager: connectionManager,
      keychain,
    });
  }

  createEntry(): Promise<ConnectionEntry> {
    return Promise.reject(
      new Error(
        'Database Tools in MongoDB Compass manage connections through the Compass connection sidebar'
      )
    );
  }

  connect(): Promise<ConnectionEntry> {
    return Promise.reject(
      new Error(
        'Database Tools in MongoDB Compass manage connections through the Compass connection sidebar'
      )
    );
  }

  get(connectionId: string): Promise<ConnectionEntry | undefined> {
    return Promise.resolve(
      connectionId === COMPASS_CONNECTION_ID ? this.entry : undefined
    );
  }

  peek(connectionId: string): Promise<ConnectionEntry | undefined> {
    return this.get(connectionId);
  }

  find(
    predicate?: (entry: ConnectionEntry) => boolean
  ): Promise<ConnectionEntry[]> {
    return Promise.resolve(
      predicate === undefined || predicate(this.entry) ? [this.entry] : []
    );
  }

  async resolve(connectionId: string): Promise<NodeDriverServiceProvider> {
    const entry = await this.get(connectionId);
    if (!entry) {
      throw new MongoDBError(
        ErrorCodes.UnknownConnectionId,
        `Connection "${connectionId}" does not exist or has expired.`
      );
    }
    return entry.getServiceProvider();
  }

  async disconnect(connectionId: string): Promise<void> {
    const entry = await this.get(connectionId);
    if (!entry) {
      throw new MongoDBError(
        ErrorCodes.UnknownConnectionId,
        `Connection "${connectionId}" does not exist or has expired.`
      );
    }
    await entry.close();
  }

  close(): Promise<void> {
    // The connection is owned by Compass, not by this registry.
    return Promise.resolve();
  }
}
