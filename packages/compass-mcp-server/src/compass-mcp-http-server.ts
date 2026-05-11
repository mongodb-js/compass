import {
  MCPHttpServer,
  type MCPHttpServerConstructorArgs,
  type UserConfig,
} from 'mongodb-mcp-server';

/**
 * Desktop AI client origins that are allowed to make cross-origin requests.
 * Empty/missing Origin headers are also allowed (native desktop apps typically omit it).
 */
const ALLOWED_ORIGINS = new Set([
  'app://obsidian',
  'vscode-file://vscode-app',
  'vscode-file://vscode-workspace',
]);

export type CompassMcpHttpServerArgs<
  TUserConfig extends UserConfig = UserConfig,
  TContext = unknown
> = MCPHttpServerConstructorArgs<TUserConfig, TContext> & {
  /**
   * Bearer token that external clients must supply in the Authorization header.
   */
  token: string;
};

/**
 * Subclass of MCPHttpServer that enforces:
 * 1. Bearer token authentication (401 on missing/wrong token)
 * 2. Origin header validation (403 on disallowed browser origins)
 *
 * Binds only to 127.0.0.1 (enforced by the runner that constructs UserConfig).
 */
export class CompassMcpHttpServer<
  TUserConfig extends UserConfig = UserConfig,
  TContext = unknown
> extends MCPHttpServer<TUserConfig, TContext> {
  private readonly token: string;

  constructor({
    token,
    ...rest
  }: CompassMcpHttpServerArgs<TUserConfig, TContext>) {
    super(rest);
    this.token = token;
  }

  protected override setupMiddlewares(): void {
    // Let the parent set up JSON body parsing and httpHeaders validation first.
    super.setupMiddlewares();

    // Bearer token auth — must come after body parsing, before routes.
    this.app.use((_req, res, next) => {
      const auth = _req.headers['authorization'];
      if (!auth || auth !== `Bearer ${this.token}`) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      next();
    });

    // Origin header validation — blocks DNS-rebinding from browsers.
    this.app.use((_req, res, next) => {
      const origin = _req.headers['origin'];
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      next();
    });
  }
}
