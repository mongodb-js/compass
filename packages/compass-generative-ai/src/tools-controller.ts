import { tool, jsonSchema } from 'ai';
import type { ToolSet } from 'ai';
import type { Logger } from '@mongodb-js/compass-logging';
import z from 'zod/v4';
import { openUtilityPort } from '@mongodb-js/compass-utils';
import { createToolsRpcClient } from './tools/infrastructure/rpc-client';
import { encodeConnectParams } from './tools/infrastructure/connect-params';
import type { ToolsRpcPort } from './tools/infrastructure/messages';
import type { ToolDefinitionInfo } from './tools/infrastructure/tools-host';
import type { ToolsConnectParams } from './tools-connection-manager';
import type { AtlasAdminApiService } from '@mongodb-js/atlas-admin-api/provider';
import type { PreferencesAccess } from '@mongodb-js/compass-preferences-model';
import { getAtlasConfigForPreset } from '@mongodb-js/atlas-service/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import {
  debugConnection,
  debugConnectionDescription,
} from './tools/debug-connection';

export type ToolGroup = 'querybar' | 'aggregation-builder' | 'db-read';

const ASSISTANT_TOOLS_STARTUP_TIMEOUT_MS = 10_000;

type CompassContext = {
  enableMCPTelemetry: boolean;
  maxTimeMS?: number;
  query?: string;
  pipeline?: string;
};

type ToolsContext = CompassContext & {
  connections: ToolsConnectParams[];
};

type ToolsControllerConfig = {
  logger: Logger;
  preferences: PreferencesAccess;
  getTelemetryAnonymousId: () => string;
  track: TrackFunction;
  enableMCPTelemetry: boolean;
  maxTimeMS?: number;
  atlasAdminApi: AtlasAdminApiService;
  // Injected for tests
  openPort?: () => ToolsRpcPort;
};

export class ToolsController {
  private logger: Logger;
  private preferences: PreferencesAccess;
  private toolGroups: Set<ToolGroup> = new Set();
  private context: ToolsContext = Object.create(null);
  private connectionIdByToolCallId: Record<string, string | null> =
    Object.create(null);
  private readonly atlasAdminApi: AtlasAdminApiService;
  private readonly track: TrackFunction;
  private readonly getTelemetryAnonymousId: () => string;
  private readonly openPort: () => ToolsRpcPort;
  /** Latest config known to the renderer, sent when the utility starts */
  private currentConfig: {
    enableMCPTelemetry: boolean;
    maxTimeMS?: number;
  };
  private portClient: ReturnType<typeof createToolsRpcClient> | null = null;
  private startPromise: Promise<void> | null = null;
  private dbToolDefinitions: ToolDefinitionInfo[] = [];

  constructor({
    logger,
    getTelemetryAnonymousId,
    enableMCPTelemetry,
    maxTimeMS,
    atlasAdminApi,
    preferences,
    track,
    openPort,
  }: ToolsControllerConfig) {
    this.logger = logger;
    this.getTelemetryAnonymousId = getTelemetryAnonymousId;
    this.atlasAdminApi = atlasAdminApi;
    this.preferences = preferences;
    this.track = track;
    this.openPort = openPort ?? (() => openUtilityPort('ai-assistant'));
    this.currentConfig = { enableMCPTelemetry, maxTimeMS };
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

    if (this.toolGroups.has('db-read') && this.dbToolDefinitions.length) {
      for (const definition of this.dbToolDefinitions) {
        tools[definition.name] = tool({
          description: getCustomToolDescription(definition),
          inputSchema: jsonSchema(definition.inputSchema),
          needsApproval: true,
          strict: false,
          execute: async (args: unknown, options) => {
            const connectParams = this.resolveConnectParams(options.toolCallId);
            return await this.portClient!.call(
              'performToolCall',
              {
                toolName: definition.name,
                toolArgs: args,
                // Encoded: connection options can hold BSON values that
                // structured cloning would flatten (see connect-params.ts)
                connectParams: encodeConnectParams(connectParams),
              },
              options.abortSignal
            );
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
    this.context = context;
    // The utility may not be started yet: remember the latest config so
    // startup sends this rather than the values the controller was built with.
    this.currentConfig = {
      enableMCPTelemetry: context.enableMCPTelemetry,
      maxTimeMS: context.maxTimeMS,
    };
    // Keep the MCP server's runtime config in the utility in sync with
    // Compass preferences; it can no longer be mutated directly from here.
    void this.portClient?.call('setUserConfig', {
      enableMCPTelemetry: context.enableMCPTelemetry,
      maxTimeMS: context.maxTimeMS,
      telemetryAnonymousId: this.getTelemetryAnonymousId(),
    });
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

  public startServer(): Promise<void> {
    this.startPromise ??= this.startServerOnce();
    return this.startPromise;
  }

  private async startServerOnce(): Promise<void> {
    try {
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_402),
        'ToolsController',
        'Starting assistant tools utility process client'
      );

      this.portClient = createToolsRpcClient(this.openPort());
      await this.withStartupTimeout(async () => {
        await this.portClient!.call('setUserConfig', {
          ...this.currentConfig,
          telemetryAnonymousId: this.getTelemetryAnonymousId(),
        });

        this.dbToolDefinitions = (await this.portClient!.call(
          'listDatabaseTools'
        )) as ToolDefinitionInfo[];
      });

      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_403),
        'ToolsController',
        'Assistant tools utility process client started successfully'
      );
    } catch (error: any) {
      // In case of errors we don't want Compass to crash so we
      // silence MCP start errors and instead log them for debugging.
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_404),
        'ToolsController',
        'Error when attempting to start MCP server',
        { error: error.message }
      );
      this.portClient?.close();
      this.portClient = null;
      this.dbToolDefinitions = [];
      this.startPromise = null;
    }
  }

  private async withStartupTimeout<T>(start: () => Promise<T>): Promise<T> {
    const timeout = new Promise<never>((_resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timed out waiting for the assistant tools utility'));
      }, ASSISTANT_TOOLS_STARTUP_TIMEOUT_MS);
      timer.unref?.();
    });
    return await Promise.race([start(), timeout]);
  }

  public async stopServer(): Promise<void> {
    if (!this.portClient) {
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_406),
        'ToolsController',
        'MCP server stop requested. No MCP server running, nothing to stop.'
      );
      return;
    }
    const client = this.portClient;
    this.portClient = null;
    this.startPromise = null;
    this.dbToolDefinitions = [];
    try {
      await client.call('stopServer');
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
    } finally {
      client.close();
    }
  }

  private resolveConnectParams(toolCallId: string): ToolsConnectParams {
    const connectionId = this.connectionIdByToolCallId[toolCallId];
    if (!connectionId) {
      // sanity check in case we ever get multiple tool calls in parallel
      const error = new Error("Can't find connection for tool call");
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_415),
        'ToolsController',
        error.message,
        {
          toolCallId,
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

    return connectParams;
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
