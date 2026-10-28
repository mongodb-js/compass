import type { Logger } from '@mongodb-js/compass-logging';
import { z } from 'zod/v4';
import { Keychain, UserConfigSchema } from 'mongodb-mcp-server';
import type { Server } from 'mongodb-mcp-server';
import { createConnectionErrorHandler } from '../../tools-connection-error-handler';
import { ToolsLogger } from '../../tools-logger';
import { ToolsConnectionManager } from '../../tools-connection-manager';
import { removeZodTransforms } from '../../remove-zod-transforms';
import { READ_ONLY_DATABASE_TOOLS } from '../../available-tools';
import type { ToolsRpcMethod, ToolsRpcPort } from './messages';
import type { ConnectParamsWire } from './connect-params';
import { decodeConnectParams } from './connect-params';
import { serveToolsRequests } from './server';
import { InMemoryRunner } from './in-memory-runner';
import { NoopMetrics } from './noop-metrics';

export type ToolDefinitionInfo = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

type ToolsHostConfig = {
  logger: Logger;
};

/**
 * Utility-process side of the assistant database tools. Owns the MCP server,
 * its connection manager, and the driver (moved here from ToolsController
 * when the server moved out of the renderer). Exposes the protocol methods
 * from `./messages` over the port the utility receives for each renderer.
 */
export class ToolsHost {
  private logger: Logger;
  private readonly runner: InMemoryRunner;
  private connectionManager: ToolsConnectionManager;
  private readonly disposable: Disposable;
  private telemetryAnonymousId = '';

  constructor(port: ToolsRpcPort, { logger }: ToolsHostConfig) {
    this.logger = logger;
    const mcpConfig = UserConfigSchema.parse({
      disabledTools: ['connect'],
      loggers: ['mcp'],
      readOnly: true,
      telemetry: 'disabled',
    });

    this.runner = new InMemoryRunner({
      userConfig: mcpConfig,
      createConnectionManager: () => Promise.resolve(this.connectionManager),
      connectionErrorHandler: createConnectionErrorHandler(),
      additionalLoggers: [new ToolsLogger(Keychain.root, logger)],
      telemetryProperties: {
        hosting_mode: 'compass',
      },
      metrics: new NoopMetrics(),
    });

    this.connectionManager = new ToolsConnectionManager({
      logger: this.runner.logger,
      getTelemetryAnonymousId: () => this.telemetryAnonymousId,
    });

    this.disposable = serveToolsRequests(port, (method, params, signal) =>
      this.handleRequest(method, params, signal)
    );
  }

  private get server(): Server | undefined {
    return this.runner.server;
  }

  private async ensureServerStarted(): Promise<Server> {
    if (!this.runner.server) {
      await this.runner.start();
    }
    const server = this.runner.server!;
    // The MCP server registers its tools lazily, on first use
    if (server.tools.length === 0) {
      server.registerTools();
    }
    return server;
  }

  private async handleRequest(
    method: ToolsRpcMethod,
    params: unknown,
    signal: AbortSignal
  ): Promise<unknown> {
    switch (method) {
      case 'setUserConfig': {
        const { enableMCPTelemetry, maxTimeMS, telemetryAnonymousId } =
          params as {
            enableMCPTelemetry: boolean;
            maxTimeMS?: number;
            telemetryAnonymousId?: string;
          };
        this.runner.userConfig.telemetry = enableMCPTelemetry
          ? 'enabled'
          : 'disabled';
        this.runner.userConfig.maxTimeMS = maxTimeMS;
        if (telemetryAnonymousId !== undefined) {
          this.telemetryAnonymousId = telemetryAnonymousId;
        }
        return;
      }
      case 'listDatabaseTools': {
        await this.ensureServerStarted();
        const readonlyNames = new Set(
          READ_ONLY_DATABASE_TOOLS.map((tool) => tool.name)
        );
        return (this.server?.tools ?? [])
          .filter((toolBase) => readonlyNames.has(toolBase.name))
          .map((toolBase) => ({
            name: toolBase.name,
            description: toolBase.description,
            inputSchema: z.toJSONSchema(
              z.object(
                Object.fromEntries(
                  Object.entries(toolBase.argsShape).map(([key, value]) => [
                    key,
                    removeZodTransforms(value),
                  ])
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
        await this.ensureServerStarted();
        const toolBase = this.server?.tools.find((t) => t.name === toolName);
        if (!toolBase) {
          throw new Error(`Unknown tool: ${toolName}`);
        }
        try {
          await this.connectionManager.connectToCompassConnection(
            connectParams
          );
        } catch (error: any) {
          this.logger.log.error(
            this.logger.mongoLogId(1_001_000_453),
            'ToolsHost',
            'Error when attempting to connect to Compass connection before executing tool',
            { error: error.message }
          );
          throw error;
        }
        try {
          return await toolBase.invoke(
            toolArgs as Parameters<typeof toolBase.invoke>[0],
            { signal }
          );
        } finally {
          await this.connectionManager.disconnect();
        }
      }
      case 'stopServer': {
        await this.runner.server?.close();
        return;
      }
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  async stop(): Promise<void> {
    // Aborts requests still in flight and stops answering new ones
    this.disposable[Symbol.dispose]();
    try {
      await this.connectionManager.disconnect();
      await this.runner.server?.close();
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
