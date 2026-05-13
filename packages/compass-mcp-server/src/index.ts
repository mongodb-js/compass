import { CompassHttpRunner } from './compass-http-runner';
import { CompassSocketServer } from './compass-socket-server';
import type {
  CompassConnectionManagerOptions,
  ConsentDecision,
  ResolvedConnection,
} from './compass-connection-manager';
import type { CompassToolContext } from './compass-tool-context';

export { CompassMcpServerManager } from './compass-mcp-server-manager';
export type { McpConnectionStorage } from './compass-mcp-server-manager';
export { runStdioBridge } from './stdio-bridge';
export { getMcpSocketPath } from './socket-path';

export type { ResolvedConnection, ConsentDecision };

export interface CompassMcpServerOptions
  extends CompassConnectionManagerOptions {
  /** Bearer token that AI clients must supply. */
  token: string;
  /** Port to listen on. Defaults to 27097. */
  port?: number;
  /** Returns all stored Compass connections for the list-connections tool. */
  getAllConnections: CompassToolContext['getAllConnections'];
  /** Asks the renderer to open a collection in a workspace tab. */
  openCollection: CompassToolContext['openCollection'];
}

export interface CompassMcpServerHandle {
  /** Full URL of the MCP endpoint, e.g. http://127.0.0.1:27097/mcp */
  url: string;
  /** Path of the local socket / named pipe the stdio bridge connects to. */
  socketPath: string;
  /** Gracefully stops the server and all active sessions. */
  stop: () => Promise<void>;
}

/**
 * Starts both transports for the Compass MCP server:
 *
 * - HTTP on 127.0.0.1, bearer-token-authenticated. For clients that prefer
 *   Streamable HTTP (e.g. configured manually with the URL + token).
 * - Local socket (Unix domain socket or Windows named pipe), unauthenticated
 *   but restricted to the same OS user via filesystem permissions. The
 *   `compass --mcp-stdio` bridge connects here.
 *
 * Each session on either transport gets its own CompassConnectionManager.
 */
export async function startMcpServer(
  opts: CompassMcpServerOptions
): Promise<CompassMcpServerHandle> {
  const httpRunner = new CompassHttpRunner({
    token: opts.token,
    port: opts.port,
    getAllConnections: opts.getAllConnections,
    openCollection: opts.openCollection,
    getConnectionInfo: opts.getConnectionInfo,
    checkConsent: opts.checkConsent,
    requestConsentFromUI: opts.requestConsentFromUI,
    saveConsent: opts.saveConsent,
  });

  const socketServer = new CompassSocketServer({
    getAllConnections: opts.getAllConnections,
    openCollection: opts.openCollection,
    getConnectionInfo: opts.getConnectionInfo,
    checkConsent: opts.checkConsent,
    requestConsentFromUI: opts.requestConsentFromUI,
    saveConsent: opts.saveConsent,
  });

  await httpRunner.start();
  try {
    await socketServer.start();
  } catch (err) {
    // If the socket fails (e.g. permission issue) we still want the HTTP
    // server up so the user can configure clients manually.
    await httpRunner.close();
    throw err;
  }

  return {
    url: `http://127.0.0.1:${opts.port ?? 27097}/mcp`,
    socketPath: socketServer.path,
    stop: async () => {
      await Promise.allSettled([socketServer.close(), httpRunner.close()]);
    },
  };
}
