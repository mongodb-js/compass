import {
  StreamableHttpRunner,
  UserConfigSchema,
  type CustomizableServerOptions,
  type CustomizableSessionOptions,
  type TransportRequestContext,
  type Server,
  type UserConfig,
  type MCPHttpServerConstructorArgs,
} from 'mongodb-mcp-server';
import { AllTools } from 'mongodb-mcp-server/tools';
import { CompassMcpHttpServer } from './compass-mcp-http-server';
import {
  CompassConnectionManager,
  type CompassConnectionManagerOptions,
} from './compass-connection-manager';
import type { ListConnectionsContext } from './list-connections-tool';
import { ListConnectionsTool } from './list-connections-tool';

const DEFAULT_PORT = 27097;
const DEFAULT_HOST = '127.0.0.1';

export interface CompassHttpRunnerOptions
  extends CompassConnectionManagerOptions {
  token: string;
  port?: number;
  getAllConnections: ListConnectionsContext['getAllConnections'];
}

/**
 * Extends StreamableHttpRunner to:
 * - Inject a fresh CompassConnectionManager per MCP session.
 * - Use CompassMcpHttpServer (adds Bearer token + Origin validation).
 * - Register the list-connections tool alongside standard read-only tools.
 * - Bind only to 127.0.0.1.
 */
export class CompassHttpRunner extends StreamableHttpRunner<
  UserConfig,
  ListConnectionsContext
> {
  private readonly compassOpts: CompassHttpRunnerOptions;

  constructor(opts: CompassHttpRunnerOptions) {
    const userConfig = UserConfigSchema.parse({
      transport: 'http',
      httpHost: DEFAULT_HOST,
      httpPort: opts.port ?? DEFAULT_PORT,
      readOnly: true,
      loggers: ['mcp'],
      telemetry: 'disabled',
      disabledTools: ['switch-connection'],
    });

    super({
      userConfig,
      createMcpHttpServer: (
        args: MCPHttpServerConstructorArgs<UserConfig, ListConnectionsContext>
      ) => new CompassMcpHttpServer({ ...args, token: opts.token }),
    });

    this.compassOpts = opts;
  }

  protected override async createServerForRequest({
    request,
    serverOptions,
    sessionOptions,
  }: {
    request: TransportRequestContext;
    serverOptions?: CustomizableServerOptions<
      UserConfig,
      ListConnectionsContext
    >;
    sessionOptions?: CustomizableSessionOptions<UserConfig>;
  }): Promise<Server<UserConfig, ListConnectionsContext>> {
    const connectionManager = new CompassConnectionManager({
      getConnectionInfo: this.compassOpts.getConnectionInfo,
      checkConsent: this.compassOpts.checkConsent,
      requestConsentFromUI: this.compassOpts.requestConsentFromUI,
      saveConsent: this.compassOpts.saveConsent,
    });

    return super.createServerForRequest({
      request,
      serverOptions: {
        ...serverOptions,
        tools: [...AllTools, ListConnectionsTool],
        toolContext: {
          getAllConnections: this.compassOpts.getAllConnections,
        },
        telemetryProperties: { hosting_mode: 'compass' },
      },
      sessionOptions: {
        ...sessionOptions,
        connectionManager,
      },
    });
  }
}
