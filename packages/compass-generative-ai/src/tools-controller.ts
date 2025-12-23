import { tool } from 'ai';
import type { ToolSet } from 'ai';
import type { Logger } from '@mongodb-js/compass-logging';
import z from 'zod';
import {
  Keychain,
  TransportRunnerBase,
  UserConfigSchema,
} from 'mongodb-mcp-server';
import type {
  Server,
  TransportRunnerConfig,
  UserConfig,
} from 'mongodb-mcp-server';
import { AllTools } from 'mongodb-mcp-server/tools';
import { createConnectionErrorHandler } from './tools-connection-error-handler';
import { ToolsLogger } from './tools-logger';
import { ToolsConnectionManager } from './tools-connection-manager';
import type { ToolsConnectParams } from './tools-connection-manager';

type ToolGroup = 'compass' | 'db-read';

type CompassContext = {
  query?: string;
  aggregation?: string;
};

type ToolsContext = CompassContext & {
  connection?: ToolsConnectParams;
};

// TODO: rather than string there must be a better type we can use here
const readonlyTools = new Set<string>([
  'find',
  'aggregate',
  'list-databases',
  'count',
  'list-databases',
  'list-collections',
  'collection-indexes',
  'collection-schema',
  //'explain',
  // TODO: we're only allowd 10 tools at the moment
  //'collection-storage-size',
  //'db-stats',
  //'mongodb-logs',
]);

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

type ToolsControllerConfig = {
  logger: Logger;
  getTelemetryAnonymousId: () => string;
};

export class ToolsController {
  private logger: Logger;
  private toolGroups: Set<ToolGroup> = new Set();
  private context: ToolsContext = Object.create(null);
  private readonly runner: InMemoryRunner;
  private connectionManager: ToolsConnectionManager;
  private currentConnection?: ToolsConnectParams;

  constructor({ logger, getTelemetryAnonymousId }: ToolsControllerConfig) {
    this.logger = logger;
    const mcpConfig = UserConfigSchema.parse({
      disabledTools: ['connect'],
      loggers: ['mcp'],
    });

    this.runner = new InMemoryRunner({
      userConfig: mcpConfig,
      createConnectionManager: () => Promise.resolve(this.connectionManager),
      connectionErrorHandler: createConnectionErrorHandler(),
      additionalLoggers: [new ToolsLogger(Keychain.root, this.logger)],
      telemetryProperties: {
        hosting_mode: 'compass',
      },
    });

    this.connectionManager = new ToolsConnectionManager({
      // TODO: this is a hack so that we can have the connection manager always
      // exist rather than only once createConnectionManager is called. Feels
      // worth it?
      logger: this.runner.logger,
      getTelemetryAnonymousId,
    });

    // Set up listener on close event to perform a cleanup when the Client
    // closes connection to MCP server and eventually ConnectionManager shuts down.
    this.connectionManager.events.on('close', (): void => {
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_405),
        'Tools Controller',
        'MCPConnectionManager closed. Performing cleanup',
        {
          connectionManagerClientName: this.connectionManager.clientName,
        }
      );
      // Nothing to do because this will only happen once when Compass is closed
    });

    this.currentConnection = undefined;
  }

  setActiveTools(toolGroups: Set<ToolGroup>): void {
    this.toolGroups = toolGroups;
  }

  getActiveTools(): ToolSet {
    const tools = Object.create(null);

    if (this.toolGroups.has('compass')) {
      tools['get-compass-context'] = {
        description: 'Get the current Compass query or aggregation.',
        inputSchema: z.object({}),
        needsApproval: true,
        strict: false,
        execute: (): Promise<CompassContext> => {
          this.logger.log.info(
            this.logger.mongoLogId(1_001_000_386),
            'ToolsController',
            'Executing get-compass-context tool'
          );
          return Promise.resolve(this.context);
        },
        // TODO: toModelOutput function to format this?
      };
    }

    if (this.runner.server && this.runner.server.tools.length === 0) {
      registerTools(this.runner.server);
    }

    if (this.currentConnection && this.toolGroups.has('db-read')) {
      const availableTools = this.runner.server?.tools ?? [];
      for (const toolBase of availableTools) {
        if (!readonlyTools.has(toolBase.name)) {
          continue;
        }

        // TODO: the types here are all messaged up for many reasons, not least
        // because somehing is up with it inferring that the z.object() is
        // actually valid for inputSchema.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        tools[toolBase.name] = tool({
          name: toolBase.name,
          description: (toolBase as any).description as string, // TODO: protected
          inputSchema: z.object((toolBase as any).argsShape), // TODO: protected
          needsApproval: true,
          strict: true,
          execute: async (args: any, options: any) => {
            return await (toolBase as any).execute(args, {
              // TODO: protected
              signal: options.abortSignal ?? new AbortSignal(),
              requestId: options.toolCallId,
              sendNotification: async () => {},
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              sendRequest: () => undefined as any,
            });
          },
        } as any);
      }
    }

    return tools;
  }

  setContext(context: ToolsContext): void {
    this.context = context;
    // TODO: This is not waiting for the connection to finish and we're relying on
    // mongodb-mcp-server's error handling and the error handling inside
    // this.switchConnectionManagerToCurrentConnection() and
    // this.connectionManager. The mongodb-mcp-server does not seem to deal with
    // a state where the connection is still being established by the time the
    // tool executes, so it won't wait for us. In that situation the tool call
    // will just fail.
    void this.switchConnectionManagerToCurrentConnection(context.connection);
  }

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  get server(): Server | undefined {
    return this.runner?.server;
  }

  public async startServer(): Promise<void> {
    if (this.runner.server) {
      return;
    }

    try {
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_402),
        'ToolsController',
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
        'ToolsController',
        'In-memory MCP server started successfully'
      );
    } catch (error) {
      // In case of errors we don't want Compass to crash so we
      // silence MCP start errors and instead log them for debugging.
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_404),
        'ToolsController',
        'Error when attempting to start MCP server',
        { error }
      );
    }
  }

  public async stopServer(): Promise<void> {
    try {
      if (!this.runner.server) {
        this.logger.log.info(
          this.logger.mongoLogId(1_001_000_406),
          'ToolsController',
          'MCP server stop requested. No MCP server running, nothing to stop.'
        );
        return;
      }
      await this.runner.server.close();
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_407),
        'ToolsController',
        'MCP server stopped successfully'
      );
    } catch (error) {
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_408),
        'ToolsController',
        'Error when attempting to close the MCP server',
        { error }
      );
    }
  }

  private async switchConnectionManagerToCurrentConnection(
    connectParams?: ToolsConnectParams
  ): Promise<void> {
    try {
      this.currentConnection = connectParams;

      await this.connectionManager.updateConnection(connectParams);
    } catch (error) {
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_410),
        'ToolsController',
        'Error when attempting to switch connection for connection manager',
        { error }
      );
    }
  }
}

// TODO: this is a complete hack because server's registerTools() is private and
// the only way it gets called is through connect() which is never going to
// happen.
function registerTools(server: Server) {
  const telemetry = {
    close: () => {},
    emitEvents: () => {},
    isTelemetryEnabled: () => false,
  };
  for (const toolConstructor of AllTools) {
    const tool = new toolConstructor({
      category: toolConstructor.category,
      operationType: toolConstructor.operationType,
      session: server.session,
      config: server.userConfig,
      telemetry: telemetry as any,
      elicitation: server.elicitation,
    });
    if (tool.register(server)) {
      server.tools.push(tool);
    }
  }
}
