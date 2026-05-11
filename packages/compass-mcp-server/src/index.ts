import { CompassHttpRunner } from './compass-http-runner';
import type {
  CompassConnectionManagerOptions,
  ConsentDecision,
  ResolvedConnection,
} from './compass-connection-manager';
import type { ListConnectionsContext } from './list-connections-tool';

export { CompassMcpServerManager } from './compass-mcp-server-manager';
export type { McpConnectionStorage } from './compass-mcp-server-manager';

export type { ResolvedConnection, ConsentDecision };

export interface CompassMcpServerOptions
  extends CompassConnectionManagerOptions {
  /** Bearer token that AI clients must supply. */
  token: string;
  /** Port to listen on. Defaults to 27097. */
  port?: number;
  /** Returns all stored Compass connections for the list-connections tool. */
  getAllConnections: ListConnectionsContext['getAllConnections'];
}

export interface CompassMcpServerHandle {
  /** Full URL of the MCP endpoint, e.g. http://127.0.0.1:27097/mcp */
  url: string;
  /** Gracefully stops the server and all active sessions. */
  stop: () => Promise<void>;
}

/**
 * Starts the Compass MCP HTTP server.
 *
 * The server listens on 127.0.0.1 only and requires a Bearer token on every
 * request. Each MCP session gets its own CompassConnectionManager.
 */
export async function startMcpServer(
  opts: CompassMcpServerOptions
): Promise<CompassMcpServerHandle> {
  const runner = new CompassHttpRunner({
    token: opts.token,
    port: opts.port,
    getAllConnections: opts.getAllConnections,
    getConnectionInfo: opts.getConnectionInfo,
    checkConsent: opts.checkConsent,
    requestConsentFromUI: opts.requestConsentFromUI,
    saveConsent: opts.saveConsent,
  });

  await runner.start();

  return {
    url: `http://127.0.0.1:${opts.port ?? 27097}/mcp`,
    stop: () => runner.close(),
  };
}
