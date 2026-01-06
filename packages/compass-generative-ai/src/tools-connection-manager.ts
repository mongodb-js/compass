import {
  ConnectionManager,
  type ConnectionStateDisconnected,
  type LoggerBase,
} from 'mongodb-mcp-server';
import {
  NodeDriverServiceProvider,
  type DevtoolsConnectOptions,
} from '@mongosh/service-provider-node-driver';
import type { ServiceProvider } from '@mongosh/service-provider-core';
import { isAtlas, isAtlasStream } from 'mongodb-build-info';
import ConnectionString from 'mongodb-connection-string-url';

export interface ToolsConnectParams {
  connectionId: string;
  connectionString: string;
  connectOptions: DevtoolsConnectOptions;
}

export const DATABASE_TOOLS_TELEMETRY_APP_NAME = 'Database Tools';
const DEFAULT_TELEMETRY_APP_NAME = 'MongoDB Compass';

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

  override connect(): Promise<never> {
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
        id: { __value: 1_001_000_412 },
        context: 'compass-tools-connection-manager',
        message: `Error disconnecting from Compass connection - ${
          error instanceof Error ? error.message : String(error)
        }`,
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
        id: { __value: 1_001_000_413 },
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
        connectOptions
      );
      this.activeConnection = {
        id: connectionId,
        provider: serviceProvider,
      };
      return void this.changeState('connection-success', {
        tag: 'connected',
        serviceProvider,
        // TODO(COMPASS-10214): implement if needed
        isSearchSupported: () => Promise.resolve(false),
      });
    } catch (error) {
      this.logger.error({
        id: { __value: 1_001_000_411 },
        context: 'compass-tools-connection-manager',
        message: `Error connecting to Compass connection - ${
          error instanceof Error ? error.message : String(error)
        }`,
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
