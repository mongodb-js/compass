import type { Logger } from '@mongodb-js/compass-logging';
import { z } from 'zod/v4';
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
  NoopExportsManager,
  QUERY_COUNT_MAX_TIME_MS_CAP,
  type MongoDBToolServer,
} from '@mongodb-js/mcp-tools-mongodb';
import type {
  ServerMetadata,
  ToolExecutionContext,
} from '@mongodb-js/mcp-types';
import {
  createCompassMcpTelemetry,
  type CompassMcpTelemetry,
} from '../../compass-mcp-telemetry';
import { createConnectionErrorHandler } from '../../tools-connection-error-handler';
import { ToolsLogger } from '../../tools-logger';
import {
  COMPASS_CONNECTION_ID,
  ToolsConnectionManager,
} from '../../tools-connection-manager';
import { ToolsConnectionRegistry } from '../../tools-connection-registry';
import { removeZodTransforms } from '../../remove-zod-transforms';
import { READ_ONLY_DATABASE_TOOLS } from '../../available-tools';
import type { ToolsRpcMethod } from './protocol';
import type { ConnectParamsWire } from './connect-params';
import { decodeConnectParams } from './connect-params';
import { serveToolsRequests } from './session';

export type ToolDefinitionInfo = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

type ToolsHostConfig = {
  logger: Logger;
};

// `HADRON_APP_VERSION` is inlined at build time for the desktop utility;
// compass-web's process shim has an empty env, so keep the fallback.
const serverMetadata: ServerMetadata = {
  mcpServerName: 'mongodb-compass',
  version: process.env.HADRON_APP_VERSION ?? '0.0.0',
};

type CompassToolServer = Omit<MongoDBToolServer, 'tools'> & {
  tools: AnyToolBase[];
};

const READ_ONLY_DATABASE_TOOL_NAMES = new Set(
  READ_ONLY_DATABASE_TOOLS.map((tool) => tool.name)
);

/**
 * Utility-process side of the assistant database tools. Owns the MCP server,
 * its connection manager, and the driver (moved here from ToolsController
 * when the server moved out of the renderer). Exposes the protocol methods
 * from `./protocol` over the port the utility receives for each renderer.
 */
export class ToolsHost {
  private readonly logger: Logger;
  private readonly keychain = new Keychain();
  private readonly serverLogger: CompositeLogger;
  private readonly connectionManager: ToolsConnectionManager;
  private readonly disposable: Disposable;
  private server?: CompassToolServer;
  private telemetry?: CompassMcpTelemetry;
  private telemetryAnonymousId = '';
  private enableMCPTelemetry = false;
  private maxTimeMS: number | undefined;
  private atlasBaseUrl: string | undefined;
  private stopped = false;

  constructor(port: MessagePort, { logger }: ToolsHostConfig) {
    this.logger = logger;
    this.serverLogger = new CompositeLogger({
      loggers: [new ToolsLogger(this.keychain, logger)],
    });

    this.connectionManager = new ToolsConnectionManager({
      logger: this.serverLogger,
      getTelemetryAnonymousId: () => this.telemetryAnonymousId,
      getMaxTimeMS: () => this.maxTimeMS,
      mongoLogId: this.logger.mongoLogId.bind(this.logger),
    });

    this.disposable = serveToolsRequests(port, (method, params, signal) =>
      this.handleRequest(method, params, signal)
    );
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
        apiBaseUrl: this.atlasBaseUrl,
      },
      () => this.enableMCPTelemetry
    );
    this.telemetry = telemetry;

    const server: CompassToolServer = {
      // Defaults mirror `UserConfigSchema`; Compass only exposes read-only tools.
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
        maxDocumentsPerQuery: 100,
        maxBytesPerQuery: 16_777_216,
        httpHost: '127.0.0.1',
        queryCountTimeoutMs: QUERY_COUNT_MAX_TIME_MS_CAP,
        aggregationCountTimeoutMs: AGG_COUNT_MAX_TIME_MS_CAP,
      },
      logger: this.serverLogger,
      keychain: this.keychain,
      connectionRegistry: new ToolsConnectionRegistry(
        this.connectionManager,
        this.keychain
      ),
      connectionErrorHandler: createConnectionErrorHandler(),
      exportsManager: new NoopExportsManager(),
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

  private ensureServerStarted(): CompassToolServer {
    this.server ??= this.createServer();
    return this.server;
  }

  private async closeServer(): Promise<void> {
    const server = this.server;
    this.server = undefined;
    await server?.mcpServer.close();
    await this.telemetry?.close();
    this.telemetry = undefined;
  }

  private async handleRequest(
    method: ToolsRpcMethod,
    params: unknown,
    signal: AbortSignal
  ): Promise<unknown> {
    switch (method) {
      case 'setUserConfig': {
        const {
          enableMCPTelemetry,
          maxTimeMS,
          telemetryAnonymousId,
          atlasBaseUrl,
        } = params as {
          enableMCPTelemetry: boolean;
          maxTimeMS?: number;
          telemetryAnonymousId?: string;
          atlasBaseUrl?: string;
        };
        // The telemetry pipeline reads the preference live, so no restart is needed.
        this.enableMCPTelemetry = enableMCPTelemetry;
        this.maxTimeMS = maxTimeMS;
        if (telemetryAnonymousId !== undefined) {
          this.telemetryAnonymousId = telemetryAnonymousId;
        }
        if (atlasBaseUrl !== undefined) {
          this.atlasBaseUrl = atlasBaseUrl;
        }
        return;
      }
      case 'listDatabaseTools': {
        const server = this.ensureServerStarted();
        return server.tools
          .filter((toolBase) =>
            READ_ONLY_DATABASE_TOOL_NAMES.has(toolBase.name)
          )
          .map((toolBase) => ({
            name: toolBase.name,
            description: toolBase.description,
            inputSchema: z.toJSONSchema(
              z.object(
                Object.fromEntries(
                  Object.entries(toolBase.argsShape())
                    // Injected in `performToolCall`; the model never picks a connection.
                    .filter(([key]) => key !== 'connectionId')
                    .map(([key, value]) => [key, removeZodTransforms(value)])
                )
              )
            ),
          }));
      }
      case 'performToolCall': {
        const {
          toolName,
          toolArgs,
          connectParams: encodedConnectParams,
        } = params as {
          toolName: string;
          toolArgs: unknown;
          connectParams: ConnectParamsWire;
        };
        const connectParams = decodeConnectParams(encodedConnectParams);
        const server = this.ensureServerStarted();
        const toolBase = server.tools.find((t) => t.name === toolName);
        if (!toolBase) {
          throw new Error(`Unknown tool: ${toolName}`);
        }
        try {
          await this.connectionManager.connectToCompassConnection(
            connectParams
          );
        } catch (error: any) {
          this.logger.log.error(
            this.logger.mongoLogId(1_001_000_455),
            'ToolsHost',
            'Error when attempting to connect to Compass connection before executing tool',
            { error: error.message }
          );
          throw error;
        }
        try {
          const context: ToolExecutionContext = { request: { signal } };
          return await toolBase.invoke(
            {
              ...(toolArgs as Record<string, unknown>),
              connectionId: COMPASS_CONNECTION_ID,
            },
            context
          );
        } finally {
          await this.connectionManager.disconnect();
        }
      }
      case 'stopServer': {
        await this.closeServer();
        return;
      }
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  async stop(): Promise<void> {
    if (this.stopped) {
      return;
    }
    this.stopped = true;
    // Aborts requests still in flight and stops answering new ones
    this.disposable[Symbol.dispose]();
    try {
      await this.connectionManager.disconnect();
      await this.closeServer();
    } catch (error: any) {
      this.logger.log.error(
        this.logger.mongoLogId(1_001_000_446),
        'ToolsHost',
        'Error when attempting to stop the MCP server',
        { error: error.message }
      );
    }
  }
}
