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
import { createConnectionErrorHandler } from './tools-connection-error-handler';
import { ToolsLogger } from './tools-logger';
import { ToolsConnectionManager } from './tools-connection-manager';
import type { ToolsConnectParams } from './tools-connection-manager';

export type ToolGroup = 'compass' | 'db-read';

type CompassContext = {
  query?: string;
  aggregation?: string;
};

type ToolsContext = CompassContext & {
  connection?: ToolsConnectParams;
};

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
  // TODO(EAI-1474): we're only allowed 10 tools at the moment
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
          // be explicit about what we return so we don't accidentally leak the
          // connection details
          return Promise.resolve({
            query: this.context.query,
            aggregation: this.context.aggregation,
          });
        },
      };
    }

    if (this.runner.server && this.runner.server.tools.length === 0) {
      this.runner.server.registerTools();
    }

    if (hasConnection(this.context) && this.toolGroups.has('db-read')) {
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
          description: toolBase.description,
          inputSchema: z.object(toolBase.argsShape),
          needsApproval: true,
          strict: true,
          execute: async (args: any, options: any) => {
            if (!hasConnection(this.context)) {
              // the context could have changed between when the tool was
              // created and when it gets executed
              // TODO: how are we supposed to signal errors?
              throw new Error('No active connection to execute tool');
            }

            // connect
            const connectParams = this.context.connection;
            try {
              await this.connectionManager.connectToCompassConnection(
                connectParams
              );
            } catch (error) {
              this.logger.log.error(
                this.logger.mongoLogId(1_001_000_410),
                'ToolsController',
                'Error when attempting to connect to Compass connection before executing tool',
                { error }
              );
              // TODO: re-throwing for now until I can tell how to signal errors
              throw error;
            }

            let result: any; // TODO: CallToolResult
            try {
              result = await toolBase.invoke(args, {
                signal: options.abortSignal ?? new AbortSignal(),
              });
            } finally {
              // disconnect
              await this.connectionManager.disconnect();
            }
            return result;
          },
        } as any); // TODO: inputSchema and execute types are messed up
      }
    }

    return tools;
  }

  setContext(context: ToolsContext): void {
    this.context = context;
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
}

function hasConnection(obj: ToolsContext): obj is ToolsContext & {
  connection: ToolsConnectParams;
} {
  return !!obj.connection;
}
