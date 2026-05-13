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
import { CompassMcpHttpServer } from './compass-mcp-http-server';
import {
  CompassConnectionManager,
  type CompassConnectionManagerOptions,
} from './compass-connection-manager';
import type { CompassToolContext } from './compass-tool-context';
import { COMPASS_TOOLS } from './compass-tools';
import { buildToolContext } from './build-tool-context';

const DEFAULT_PORT = 27097;
const DEFAULT_HOST = '127.0.0.1';

export interface CompassHttpRunnerOptions
  extends CompassConnectionManagerOptions {
  token: string;
  port?: number;
  getAllConnections: CompassToolContext['getAllConnections'];
  openCollection: CompassToolContext['openCollection'];
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
  CompassToolContext
> {
  private readonly compassOpts: CompassHttpRunnerOptions;

  constructor(opts: CompassHttpRunnerOptions) {
    const userConfig = UserConfigSchema.parse({
      transport: 'http',
      httpHost: DEFAULT_HOST,
      httpPort: opts.port ?? DEFAULT_PORT,
      // We enforce read-only / metadata-only by registering an explicit tool
      // allowlist (see compass-tools.ts) and gating per-call against the
      // active connection's preset. Upstream `readOnly: true` would also
      // strip `$out` / `$merge` from aggregate pipelines unconditionally —
      // we want those stages available for the `full-access` preset, so we
      // run with readOnly:false and apply the same restriction ourselves in
      // `aggregateStageGate` for non-full-access presets.
      readOnly: false,
      loggers: ['mcp'],
      telemetry: 'disabled',
      disabledTools: ['switch-connection'],
    });

    super({
      userConfig,
      createMcpHttpServer: (
        args: MCPHttpServerConstructorArgs<UserConfig, CompassToolContext>
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
    serverOptions?: CustomizableServerOptions<UserConfig, CompassToolContext>;
    sessionOptions?: CustomizableSessionOptions<UserConfig>;
  }): Promise<Server<UserConfig, CompassToolContext>> {
    const connectionManager = new CompassConnectionManager({
      getConnectionInfo: this.compassOpts.getConnectionInfo,
      checkAccess: this.compassOpts.checkAccess,
      requestAccessFromUI: this.compassOpts.requestAccessFromUI,
      saveAccess: this.compassOpts.saveAccess,
    });

    return super.createServerForRequest({
      request,
      serverOptions: {
        ...serverOptions,
        tools: COMPASS_TOOLS,
        toolContext: buildToolContext(connectionManager, this.compassOpts),
        telemetryProperties: { hosting_mode: 'compass' },
      },
      sessionOptions: {
        ...sessionOptions,
        connectionManager,
      },
    });
  }
}
