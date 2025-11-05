import type { Logger } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { DevtoolsConnectOptions } from '@mongosh/service-provider-node-driver';
import type {
  LoggerType,
  LogLevel,
  LogPayload,
  ConnectionManagerFactoryFn,
  ConnectionManager,
  TransportRunnerConfig,
  Server,
  UserConfig,
} from 'mongodb-mcp-server';
import { TransportRunnerBase, UserConfigSchema } from 'mongodb-mcp-server';
import { LoggerBase, Keychain } from 'mongodb-mcp-server';
import type { MCPConnectParams } from './mcp-connection-manager';
import { MCPConnectionManager } from './mcp-connection-manager';
import { createMCPConnectionErrorHandler } from './mcp-connection-error-handler';
import type { ConnectionsService } from '@mongodb-js/compass-connections/src/stores/store-context';
import { type ToolSet, tool } from 'ai';
import z from 'zod';

class CompassMCPLogger extends LoggerBase {
  private readonly _logger: Logger;
  protected type: LoggerType = 'console';

  constructor(keychain: Keychain, logger: Logger) {
    super(keychain);
    this._logger = logger;
  }

  protected logCore(level: LogLevel, payload: LogPayload): void {
    const logMethod = this.mapToMongoDBLogLevel(level);

    this._logger.log[logMethod](
      this._logger.mongoLogId(1_001_000_400),
      'MCP Server',
      `${payload.id.__value} - ${payload.context}: ${payload.message}`,
      ...(payload.attributes ? [payload.attributes] : [])
    );
  }

  protected mapToMongoDBLogLevel(
    level: LogLevel
  ): 'debug' | 'info' | 'warn' | 'error' {
    switch (level) {
      case 'debug':
        return 'debug';
      case 'info':
        return 'info';
      case 'warning':
        return 'warn';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }
}

/**
 * In-memory MCP runner that doesn't bind to any external transport.
 * The server is kept in memory for direct programmatic access.
 */
class InMemoryRunner extends TransportRunnerBase {
  public server?: Server;
  public readonly userConfig: UserConfig;

  constructor(config: TransportRunnerConfig) {
    super(config);
    this.userConfig = config.userConfig;
  }

  async start(): Promise<void> {
    this.server = await this.setupServer();
  }

  async closeTransport(): Promise<void> {
    await this.server?.close();
  }
}

export type MCPServerInfo = {
  runner: InMemoryRunner;
  server: Server; // Server instance from mongodb-mcp-server
};

type MCPControllerConfig = {
  logger: Logger;
  preferences: PreferencesAccess;
  getTelemetryAnonymousId: () => string;
  connections: ConnectionsService;
};

export class MCPController {
  private logger: Logger;
  private connections: ConnectionsService;
  private preferences: PreferencesAccess;
  private getTelemetryAnonymousId: () => string;
  private mcpConnectionManagers: MCPConnectionManager[] = [];
  private currentConnectionId?: string;
  private currentConnectionString?: string;
  private currentConnectOptions?: DevtoolsConnectOptions;

  constructor({
    logger,
    preferences,
    getTelemetryAnonymousId,
    connections,
  }: MCPControllerConfig) {
    this.logger = logger;
    this.connections = connections;
    this.preferences = preferences;
    this.getTelemetryAnonymousId = getTelemetryAnonymousId;
    const mcpConfig = UserConfigSchema.parse({
      disabledTools: ['connect'],
      loggers: ['mcp'],
    });
    this.runner = new InMemoryRunner({
      userConfig: mcpConfig,
      createConnectionManager: (
        ...params: Parameters<ConnectionManagerFactoryFn>
      ) => MCPController.createConnectionManager(this, ...params),
      connectionErrorHandler: createMCPConnectionErrorHandler(),
      additionalLoggers: [new CompassMCPLogger(Keychain.root, this.logger)],
      telemetryProperties: {
        hosting_mode: 'compass',
      },
    });
  }

  private readonly runner: InMemoryRunner;
  get server(): Server | undefined {
    return this.runner?.server;
  }

  public async activate(): Promise<void> {
    // Check if MCP server should be auto-started
    const { enableMcpServer } = this.preferences.getPreferences();
    if (enableMcpServer) {
      await this.startServer();
    }
  }

  public async startServer(): Promise<void> {
    try {
      if (this.runner.server) {
        this.logger.log.info(
          this.logger.mongoLogId(1_001_000_401),
          'MCP Server',
          'MCP server start requested. An MCP server is already running, will not start a new server.'
        );
        return;
      }

      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_402),
        'MCP Server',
        'Starting in-memory MCP server with config',
        {
          ...this.runner.userConfig,
          apiClientId: '<redacted>',
          apiClientSecret: '<redacted>',
        }
      );

      await this.runner.start();

      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_403),
        'MCP Server',
        'In-memory MCP server started successfully'
      );
    } catch (error) {
      // In case of errors we don't want Compass to crash so we
      // silence MCP start errors and instead log them for debugging.
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_404),
        'MCP Server',
        'Error when attempting to start MCP server',
        { error }
      );
    }
  }

  private static async createConnectionManager(
    mcpController: MCPController,
    ...params: Parameters<ConnectionManagerFactoryFn>
  ): Promise<ConnectionManager> {
    const [{ logger: mcpLogger }] = params;
    const connectionManager = new MCPConnectionManager({
      logger: mcpLogger,
      getTelemetryAnonymousId: mcpController.getTelemetryAnonymousId,
    });

    // Track this ConnectionManager instance for future connection updates
    mcpController.mcpConnectionManagers.push(connectionManager);

    // Set up listener on close event to perform a cleanup when the Client
    // closes connection to MCP server and eventually ConnectionManager shuts down.
    connectionManager.events.on('close', (): void => {
      mcpController.logger.log.info(
        mcpController.logger.mongoLogId(1_001_000_405),
        'MCP Server',
        'MCPConnectionManager closed. Performing cleanup',
        {
          connectionManagerClientName: connectionManager.clientName,
        }
      );
      mcpController.mcpConnectionManagers =
        mcpController.mcpConnectionManagers.filter(
          (manager) => manager !== connectionManager
        );
    });

    // The newly created ConnectionManager needs to be brought up to date with
    // the current connection state.
    await mcpController.switchConnectionManagerToCurrentConnection(
      connectionManager
    );
    return connectionManager;
  }

  public async stopServer(): Promise<void> {
    try {
      if (!this.runner.server) {
        this.logger.log.info(
          this.logger.mongoLogId(1_001_000_406),
          'MCP Server',
          'MCP server stop requested. No MCP server running, nothing to stop.'
        );
        return;
      }
      await this.runner.server.close();
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_407),
        'MCP Server',
        'MCP server stopped successfully'
      );
    } catch (error) {
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_408),
        'MCP Server',
        'Error when attempting to close the MCP server',
        { error }
      );
    }
  }

  public getToolDescription(name: string): string | undefined {
    if (!this.runner.server) {
      return undefined;
    }
    return this.runner.server
      ?.getAvailableTools()
      .find((toolBase) => toolBase.name === name)?.description;
  }

  public getTools(): ToolSet {
    if (!this.runner.server) {
      return {};
    }
    console.log(
      'this.runner.server?.getAvailableTools()',
      this.runner.server?.getAvailableTools()
    );
    return Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.runner.server
        ?.getAvailableTools()
        .filter((toolBase) => !toolBase.name.includes('atlas'))
        .slice(0, 10)
        .map((toolBase) => {
          return [
            toolBase.name,
            tool({
              name: toolBase.name,
              description: toolBase.description,
              inputSchema: z.object(toolBase.argsShape),
              needsApproval:
                toolBase.operationType !== 'read' &&
                toolBase.operationType !== 'metadata',
              execute: async (args, options) => {
                return await toolBase.execute(args, {
                  signal: options.abortSignal ?? new AbortSignal(),
                  requestId: options.toolCallId,
                  sendNotification: async () => {},
                  sendRequest: () => undefined as any,
                });
              },
            }),
          ];
        }) ?? []
    );
  }

  public async onActiveConnectionChanged(
    connectionId: string | undefined
  ): Promise<void> {
    this.logger.log.info(
      this.logger.mongoLogId(1_001_000_409),
      'MCP Server',
      'Active connection changed, will switch connection manager to new connection',
      {
        connectionId,
        serverStarted: !!this.server,
      }
    );

    // Look up connection details if connection ID is provided
    let connectionString: string | undefined;
    let connectOptions: DevtoolsConnectOptions | undefined;

    if (connectionId) {
      const dataService =
        this.connections.getDataServiceForConnection(connectionId);
      if (dataService) {
        const connectionOptions = dataService.getMongoClientConnectionOptions();
        if (connectionOptions) {
          connectionString = connectionOptions.url;
          connectOptions = connectionOptions.options;
        }
      } else {
        this.logger.log.warn(
          this.logger.mongoLogId(1_001_000_411),
          'MCP Server',
          'Could not find data service for connection',
          { connectionId }
        );
      }
    }

    // Store current connection details for connection managers
    this.currentConnectionId = connectionId;
    this.currentConnectionString = connectionString;
    this.currentConnectOptions = connectOptions;

    await Promise.all(
      this.mcpConnectionManagers.map((manager) =>
        this.switchConnectionManagerToCurrentConnection(manager)
      )
    );
  }

  private async switchConnectionManagerToCurrentConnection(
    connectionManager: MCPConnectionManager
  ): Promise<void> {
    try {
      const connectParams: MCPConnectParams | undefined =
        this.currentConnectionId && this.currentConnectionString
          ? {
              connectionId: this.currentConnectionId,
              connectionString: this.currentConnectionString,
              connectOptions: (this.currentConnectOptions ??
                {}) as DevtoolsConnectOptions,
            }
          : undefined;
      await connectionManager.updateConnection(connectParams);
    } catch (error) {
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_410),
        'MCP Server',
        'Error when attempting to switch connection for connection manager',
        { error }
      );
    }
  }

  public async deactivate(): Promise<void> {
    await this.stopServer();
  }
}
