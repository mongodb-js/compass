import { tool } from 'ai';
import type { ToolSet } from 'ai';
import type { Logger } from '@mongodb-js/compass-logging';
import z from 'zod/v4';
import {
  CompositeLogger,
  Elicitation,
  Keychain,
  McpServer,
  NoopMetrics,
  type AnyToolBase,
} from '@mongodb-js/mcp-core';
import {
  AGG_COUNT_MAX_TIME_MS_CAP,
  MongoDBTools,
  QUERY_COUNT_MAX_TIME_MS_CAP,
  type MongoDBToolServer,
} from '@mongodb-js/mcp-tools-mongodb';
import {
  createCompassMcpTelemetry,
  type CompassMcpTelemetry,
} from './compass-mcp-telemetry';
import type {
  ServerMetadata,
  ToolExecutionContext,
} from '@mongodb-js/mcp-types';
import { createConnectionErrorHandler } from './tools-connection-error-handler';
import { ToolsLogger } from './tools-logger';
import {
  COMPASS_CONNECTION_ID,
  ToolsConnectionManager,
  ToolsConnectionRegistry,
} from './tools-connection-manager';
import type { ToolsConnectParams } from './tools-connection-manager';
import { removeZodTransforms } from './remove-zod-transforms';
import { READ_ONLY_DATABASE_TOOLS } from './available-tools';
import type { AtlasAdminApiService } from '@mongodb-js/atlas-admin-api/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import { getAtlasConfigForPreset } from '@mongodb-js/atlas-service/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import {
  debugConnection,
  debugConnectionDescription,
} from './tools/debug-connection';

export type ToolGroup = 'querybar' | 'aggregation-builder' | 'db-read';

type CompassContext = {
  enableMCPTelemetry: boolean;
  maxTimeMS?: number;
  query?: string;
  pipeline?: string;
};

type ToolsContext = CompassContext & {
  connections: ToolsConnectParams[];
};

// Version is unused: telemetry is the only consumer and ToolsConnectionManager
// always overrides the driver appName.
const serverMetadata: ServerMetadata = {
  mcpServerName: 'mongodb-compass',
  version: '0.0.0',
};

type CompassToolServer = MongoDBToolServer & { tools: AnyToolBase[] };

const READ_ONLY_DATABASE_TOOL_NAMES = new Set(
  READ_ONLY_DATABASE_TOOLS.map((tool) => tool.name)
);

type ToolsControllerConfig = {
  logger: Logger;
  preferences: PreferencesAccess;
  getTelemetryAnonymousId: () => string;
  track: TrackFunction;
  enableMCPTelemetry: boolean;
  maxTimeMS?: number;
  atlasAdminApi: AtlasAdminApiService;
};

export class ToolsController {
  private logger: Logger;
  private preferences: PreferencesAccess;
  private toolGroups: Set<ToolGroup> = new Set();
  private context: ToolsContext = Object.create(null);
  private toolServer?: CompassToolServer;
  private readonly keychain = new Keychain();
  private readonly serverLogger: CompositeLogger;
  private telemetry?: CompassMcpTelemetry;
  private connectionManager: ToolsConnectionManager;
  private connectionIdByToolCallId: Record<string, string | null> =
    Object.create(null);
  private readonly atlasAdminApi: AtlasAdminApiService;
  private readonly track: TrackFunction;

  constructor({
    logger,
    getTelemetryAnonymousId,
    track,
    enableMCPTelemetry,
    maxTimeMS,
    atlasAdminApi,
    preferences,
  }: ToolsControllerConfig) {
    this.logger = logger;
    this.atlasAdminApi = atlasAdminApi;
    this.preferences = preferences;
    this.track = track;
    this.context = { ...this.context, enableMCPTelemetry, maxTimeMS };
    this.serverLogger = new CompositeLogger({
      loggers: [new ToolsLogger(this.keychain, logger)],
    });

    this.connectionManager = new ToolsConnectionManager({
      logger: this.serverLogger,
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

  private async closeTelemetry(): Promise<void> {
    await this.telemetry?.close();
    this.telemetry = undefined;
  }

  private createServer(): CompassToolServer {
    const mcpServer = new McpServer({
      name: serverMetadata.mcpServerName,
      version: serverMetadata.version,
    });
    const tools: AnyToolBase[] = [];

    const telemetry = createCompassMcpTelemetry(
      {
        logger: this.serverLogger,
        keychain: this.keychain,
        serverMetadata,
      },
      () => this.context.enableMCPTelemetry
    );
    this.telemetry = telemetry;

    const server: CompassToolServer = {
      // Defaults mirror `UserConfigSchema`; Compass only exposes read-only tools,
      // so the write- and Atlas-specific options are unused.
      config: {
        transport: 'stdio',
        httpResponseType: 'sse',
        readOnly: true,
        disabledTools: ['connect'],
        confirmationRequiredTools: [],
        previewFeatures: [],
        connectionString: undefined,
        indexCheck: false,
        disableServerSideJs: true,
        maxTimeMS: this.context.maxTimeMS,
        maxDocumentsPerQuery: 100,
        maxBytesPerQuery: 16_777_216,
        httpHost: '127.0.0.1',
        queryCountMaxTimeMsCap: QUERY_COUNT_MAX_TIME_MS_CAP,
        aggregationCountMaxTimeMsCap: AGG_COUNT_MAX_TIME_MS_CAP,
      },
      logger: this.serverLogger,
      keychain: this.keychain,
      connectionRegistry: new ToolsConnectionRegistry(
        this.connectionManager,
        this.keychain
      ),
      // `MongoDBToolServices` requires a `result` that is only read when
      // `errorHandled` is true; Compass never handles connection errors.
      connectionErrorHandler:
        createConnectionErrorHandler() as MongoDBToolServer['connectionErrorHandler'],
      // Only the unregistered `export` tool reads this.
      exportsManager: {
        createJSONExport: () => {
          return Promise.reject(
            new Error(
              'Exporting data is not supported in Compass Database Tools'
            )
          );
        },
      },
      telemetry,
      elicitation: new Elicitation({ server: mcpServer.server }),
      metrics: new NoopMetrics(),
      mcpServer,
      tools,
      isToolCategoryAvailable: (category) => {
        return tools.some((tool) => tool.category === category);
      },
    };

    for (const ToolConstructor of MongoDBTools) {
      if (!READ_ONLY_DATABASE_TOOL_NAMES.has(ToolConstructor.toolName)) {
        continue;
      }
      const toolInstance = new ToolConstructor({ server });
      if (toolInstance.register()) {
        tools.push(toolInstance);
      }
    }

    return server;
  }

  setActiveTools(toolGroups: Set<ToolGroup>): void {
    this.toolGroups = toolGroups;
  }

  getActiveTools(): ToolSet {
    const tools = Object.create(null);

    if (this.toolGroups.has('querybar')) {
      tools['get-current-query'] = {
        description: 'Get the query from the focused tab.',
        inputSchema: z.object({}),
        needsApproval: true,
        strict: false,
        execute: (): Promise<{ query?: string }> => {
          this.logger.log.info(
            this.logger.mongoLogId(1_001_000_386),
            'ToolsController',
            'Executing get-current-query tool'
          );
          return Promise.resolve({
            query: this.context.query,
          });
        },
      };
    }

    if (this.toolGroups.has('aggregation-builder')) {
      tools['get-current-pipeline'] = {
        description: 'Get the pipeline from the focused tab.',
        inputSchema: z.object({}),
        needsApproval: true,
        strict: false,
        execute: (): Promise<{ pipeline?: string }> => {
          this.logger.log.info(
            this.logger.mongoLogId(1_001_000_416),
            'ToolsController',
            'Executing get-current-pipeline tool'
          );
          return Promise.resolve({
            pipeline: this.context.pipeline,
          });
        },
      };
    }

    if (this.toolGroups.has('db-read') && this.toolServer) {
      for (const toolBase of this.toolServer.tools) {
        tools[toolBase.name] = tool({
          description: getCustomToolDescription(toolBase),
          inputSchema: z.object(
            Object.fromEntries(
              Object.entries(toolBase.argsShape())
                // Injected in `execute`; the model never picks a connection.
                .filter(([key]) => key !== 'connectionId')
                .map(([key, value]) => {
                  // TODO: MCP server applies transformations like toEJSON.
                  // We should come up with a better solution for this but for now we recursively remove the transforms.
                  // AI SDK applies transformations defined in the schema *before* sending the request to the model.
                  return [key, removeZodTransforms(value)];
                })
            )
          ),
          needsApproval: true,
          strict: true,
          execute: async (args, options) => {
            const connectionId =
              this.connectionIdByToolCallId[options.toolCallId];
            if (!connectionId) {
              // sanity check in case we ever get multiple tool calls in parallel
              const error = new Error("Can't find connection for tool call");
              this.logger.log.error(
                this.logger.mongoLogId(1_001_000_415),
                'ToolsController',
                error.message,
                {
                  toolCallId: options.toolCallId,
                }
              );
              throw error;
            }

            const connectParams = this.context.connections.find(
              (connection) => connection.connectionId === connectionId
            );
            if (!connectParams) {
              // the context could have changed between when the tool was
              // created and when it gets executed
              const error = new Error('No active connection to execute tool');
              this.logger.log.error(
                this.logger.mongoLogId(1_001_000_414),
                'ToolsController',
                error.message
              );
              throw error;
            }

            // connect
            try {
              await this.connectionManager.connectToCompassConnection(
                connectParams
              );
            } catch (error: any) {
              this.logger.log.error(
                this.logger.mongoLogId(1_001_000_410),
                'ToolsController',
                'Error when attempting to connect to Compass connection before executing tool',
                { error: error.message }
              );
              throw error;
            }

            let result: Awaited<ReturnType<typeof toolBase.invoke>>;
            try {
              const context: ToolExecutionContext = {
                request: {
                  signal: options.abortSignal ?? new AbortController().signal,
                },
              };
              result = await toolBase.invoke(
                { ...args, connectionId: COMPASS_CONNECTION_ID },
                context
              );
            } finally {
              // disconnect
              await this.connectionManager.disconnect();
            }
            return result;
          },
        });
      }
    }

    const { enableAtlasConnectionErrorDebuggerTool } =
      this.preferences.getPreferences();
    if (enableAtlasConnectionErrorDebuggerTool) {
      tools['atlas-connection-error-debugger'] = {
        description: debugConnectionDescription,
        inputSchema: z.object({
          connectionString: z.string(),
          errorMessage: z.string(),
          connectionName: z
            .string()
            .optional()
            .describe(
              'The name of the connection the failed connection attempt was made to. Only used to display which connection is being debugged.'
            ),
        }),
        needsApproval: true,
        strict: false,
        execute: async (args: {
          connectionString: string;
          errorMessage: string;
          connectionName?: string;
        }) => {
          this.logger.log.info(
            this.logger.mongoLogId(1_001_000_436),
            'ToolsController',
            'Executing atlas-connection-error-debugger tool'
          );

          return await debugConnection(
            args.connectionString,
            this.atlasAdminApi,
            this.track,
            getAtlasConfigForPreset(
              this.preferences.getPreferences().atlasServiceBackendPreset
            ).atlasUiBaseUrl
          );
        },
      };
    }

    return tools;
  }

  setContext(context: ToolsContext): void {
    // make sure these properties are always in sync with the tools' config
    if (this.toolServer) {
      this.toolServer.config.maxTimeMS = context.maxTimeMS;
    }
    this.context = context;
  }

  setConnectionIdForToolCall({
    toolCallId,
    connectionId,
  }: {
    toolCallId: string;
    connectionId: string | null;
  }): void {
    this.connectionIdByToolCallId[toolCallId] = connectionId;
  }

  get server(): CompassToolServer | undefined {
    return this.toolServer;
  }

  public async startServer(): Promise<void> {
    if (this.toolServer) {
      return;
    }

    try {
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_402),
        'ToolsController',
        'Starting in-memory MCP server',
        {
          maxTimeMS: this.context.maxTimeMS,
        }
      );

      this.toolServer = this.createServer();

      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_403),
        'ToolsController',
        'In-memory MCP server started successfully'
      );
    } catch (error: any) {
      // In case of errors we don't want Compass to crash so we
      // silence MCP start errors and instead log them for debugging.
      await this.closeTelemetry();
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_404),
        'ToolsController',
        'Error when attempting to start MCP server',
        { error: error.message }
      );
    }
  }

  public async stopServer(): Promise<void> {
    try {
      if (!this.toolServer) {
        this.logger.log.info(
          this.logger.mongoLogId(1_001_000_406),
          'ToolsController',
          'MCP server stop requested. No MCP server running, nothing to stop.'
        );
        return;
      }
      const server = this.toolServer;
      this.toolServer = undefined;
      await server.mcpServer.close();
      await this.closeTelemetry();
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_407),
        'ToolsController',
        'MCP server stopped successfully'
      );
    } catch (error: any) {
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_408),
        'ToolsController',
        'Error when attempting to close the MCP server',
        { error: error.message }
      );
    }
  }
}

function getCustomToolDescription(toolBase: {
  name: string;
  description: string;
}): string {
  // We want to provide more detailed descriptions for some tools to help guide the model in using them effectively.
  switch (toolBase.name) {
    case 'collection-schema':
      return (
        toolBase.description +
        ' Always use this tool to access collection schema information whenever asked to generate queries or aggregations and before performing queries or aggregations.'
      );
    case 'find':
      return (
        toolBase.description +
        ' Always use the collection-schema tool to access collection schema information before using this tool to perform queries.'
      );
    case 'aggregate':
      return (
        toolBase.description +
        ' Always use the collection-schema tool to access collection schema information before using this tool to perform aggregations.'
      );
    default:
      return toolBase.description;
  }
}
