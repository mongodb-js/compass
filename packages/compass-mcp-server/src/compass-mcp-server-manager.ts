import crypto from 'crypto';
import path from 'path';
import { app, BrowserWindow, shell } from 'electron';
import { ipcMain } from 'hadron-ipc';
import { createLogger, mongoLogId } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';
// Importing CompassSocketServer here also triggers a module-load side effect
// that patches the upstream MCP `initialize` instructions to be Compass-specific.
import { CompassSocketServer } from './compass-socket-server';
import { MCP_IPC } from './ipc-channels';
import type { McpSavedQueryStorage } from './mcp-saved-query-storage';
import {
  detectInClient,
  installInClient,
  uninstallFromClient,
} from './auto-setup';
import { type AiClientId, getAllClientConfigPaths } from './client-paths';
import type { OpenCollectionOptions } from './compass-tool-context';
import type { ConsentResult } from './compass-connection-manager';
import {
  normalizeMcpAccess,
  type McpAccess,
} from '@mongodb-js/connection-info';

const { log } = createLogger('COMPASS-MCP');

/**
 * The Compass binary invocation used by AI client config snippets and by
 * the auto-install / auto-detect handlers — kept here as a single source of
 * truth so the UI and the on-disk config never diverge.
 */
function getBridgeInvocation(): { command: string; args: string[] } {
  // Packaged Compass: `process.execPath` IS the user-facing binary; it
  // already routes `--mcp-stdio` to the stdio bridge.
  if (app.isPackaged) {
    return { command: process.execPath, args: ['--mcp-stdio'] };
  }

  // Dev (`npm start`): pointing Claude / Cursor / VS Code / Windsurf at
  // `electron build/main.js --mcp-stdio` directly is broken because
  // webpack-dev-server prepends an HMR client to the main bundle that
  // logs `[HMR] Waiting for update signal from WDS...` to stdout — the
  // MCP wire. The AI client's JSON-RPC parser chokes on the non-JSON
  // line.
  //
  // We route AI clients through a tiny Node wrapper instead. It spawns
  // the same Electron build and sits between the AI client and the dev
  // build, scrubbing non-JSON-RPC lines out of stdout. The wrapper
  // doesn't ship in packaged builds — only the dev path uses it.
  //
  // We invoke the wrapper via `node`, which is on every dev machine's
  // PATH (npm needs it). At runtime this module is bundled into
  // `packages/compass/build/main.js`, so `app.getAppPath()` returns that
  // `build/` directory; the wrapper lives two levels up, in the sibling
  // `compass-mcp-server` package.
  //
  //   build/         ← app.getAppPath()
  //   ../            ← packages/compass/
  //   ../../         ← packages/
  //   ../../compass-mcp-server/scripts/dev-stdio-bridge.js
  const wrapper = path.resolve(
    app.getAppPath(),
    '..',
    '..',
    'compass-mcp-server',
    'scripts',
    'dev-stdio-bridge.js'
  );
  return { command: 'node', args: [wrapper] };
}

export interface McpConnectionStorage {
  loadAll(): Promise<
    Array<{
      id: string;
      favorite?: { name?: string };
      connectionOptions: { connectionString: string };
      // Persisted as `McpAccess` (discriminated union) but we accept `unknown`
      // here for backward compatibility with legacy strings — normalizeMcpAccess
      // handles the conversion.
      mcpAccess?: unknown;
    }>
  >;
  save(opts: { connectionInfo: Record<string, unknown> }): Promise<void>;
}

export class CompassMcpServerManager {
  private static socketServer: CompassSocketServer | null = null;
  private static lastError: string | undefined;

  static async init(
    preferences: PreferencesAccess,
    connectionStorage: McpConnectionStorage,
    savedQueryStorage: McpSavedQueryStorage
  ): Promise<void> {
    const opts = {
      getAllConnections: async () => {
        const connections = await connectionStorage.loadAll();
        return connections.map((c) => ({
          id: c.id,
          name: c.favorite?.name ?? c.id,
          access: normalizeMcpAccess(c.mcpAccess),
        }));
      },
      getConnectionInfo: async (id: string) => {
        const connections = await connectionStorage.loadAll();
        const info = connections.find((c) => c.id === id);
        if (!info) return undefined;
        return {
          connectionString: info.connectionOptions.connectionString,
          displayName: info.favorite?.name ?? id,
        };
      },
      checkAccess: async (id: string) => {
        const connections = await connectionStorage.loadAll();
        const info = connections.find((c) => c.id === id);
        return normalizeMcpAccess(info?.mcpAccess);
      },
      requestAccessFromUI: ({
        connectionId,
        connectionName,
        clientName,
      }: {
        connectionId: string;
        connectionName: string;
        clientName: string;
      }): Promise<ConsentResult> => {
        const requestId = crypto.randomUUID();
        return new Promise((resolve) => {
          const responseChannel = MCP_IPC.consentResponse(requestId);
          const timer = setTimeout(() => {
            ipcMain.removeAllListeners(responseChannel);
            resolve({ access: { mode: 'denied' }, remember: false });
          }, 60_000);

          ipcMain.once(
            responseChannel,
            (_event: unknown, response: ConsentResult) => {
              clearTimeout(timer);
              resolve(response);
            }
          );

          ipcMain.broadcast(MCP_IPC.ConsentRequest, {
            requestId,
            connectionId,
            connectionName,
            clientName,
          });
        });
      },
      saveAccess: async (id: string, access: McpAccess) => {
        const connections = await connectionStorage.loadAll();
        const info = connections.find((c) => c.id === id);
        if (info) {
          await connectionStorage.save({
            connectionInfo: { ...info, mcpAccess: access },
          });
        }
      },
      openCollection: (
        connectionId: string,
        namespace: string,
        options?: OpenCollectionOptions
      ) => {
        // Fire-and-forget: ask the Compass renderer(s) to open the
        // collection in a workspace tab. We intentionally use `broadcast`
        // (every Compass window) rather than `broadcastFocused`, because
        // when an AI client calls this tool the focused OS window is the
        // AI client itself (Claude Desktop / Cursor / ...), not Compass —
        // and `broadcastFocused` would silently drop the message.
        ipcMain.broadcast(MCP_IPC.OpenCollection, {
          connectionId,
          namespace,
          options: options ?? {},
        });
        // Subtle attention nudge so the user notices that Compass has
        // something new to show without us stealing focus from their IDE
        // / chat client. On macOS this bounces the Dock icon once; on
        // Linux/Windows it flashes the taskbar entry until focused.
        try {
          if (process.platform === 'darwin') {
            app.dock?.bounce('informational');
          } else {
            for (const win of BrowserWindow.getAllWindows()) {
              win.flashFrame(true);
            }
          }
        } catch {
          /* best-effort UX nudge; never let it crash the tool call */
        }
      },
      // Saved-query catalog (list + save). Delegated to the storage
      // adapter provided by the host (Compass main); the MCP server just
      // forwards. listSavedQueries naturally filters out items without a
      // description — that's done inside the adapter.
      listSavedQueries: () => savedQueryStorage.loadDescribed(),
      saveSavedQuery: (
        input: Parameters<typeof savedQueryStorage.saveQuery>[0]
      ) => savedQueryStorage.saveQuery(input),
      saveSavedAggregation: (
        input: Parameters<typeof savedQueryStorage.saveAggregation>[0]
      ) => savedQueryStorage.saveAggregation(input),
    };

    const startServer = async (): Promise<void> => {
      if (this.socketServer) return;
      try {
        const server = new CompassSocketServer(opts);
        await server.start();
        this.socketServer = server;
        this.lastError = undefined;
        log.info(
          mongoLogId(1_001_000_450),
          'MCP Server',
          'MCP server started',
          { socketPath: server.path }
        );
        ipcMain.broadcast(MCP_IPC.StatusUpdate, { status: 'running' });
      } catch (err) {
        log.error(
          mongoLogId(1_001_000_451),
          'MCP Server',
          'Failed to start MCP server',
          { error: (err as Error).message }
        );
        this.lastError = (err as Error).message;
        ipcMain.broadcast(MCP_IPC.StatusUpdate, {
          status: 'error',
          error: this.lastError,
        });
      }
    };

    const stopServer = async (): Promise<void> => {
      if (!this.socketServer) return;
      try {
        await this.socketServer.close();
        this.socketServer = null;
        this.lastError = undefined;
        ipcMain.broadcast(MCP_IPC.StatusUpdate, { status: 'stopped' });
      } catch (err) {
        log.error(
          mongoLogId(1_001_000_452),
          'MCP Server',
          'Error stopping MCP server',
          { error: (err as Error).message }
        );
      }
    };

    ipcMain.respondTo(MCP_IPC.GetStatus, () => {
      if (this.socketServer) return { status: 'running' };
      if (this.lastError) return { status: 'error', error: this.lastError };
      return { status: 'stopped' };
    });

    ipcMain.respondTo(MCP_IPC.GetBridgeInfo, () => {
      const { command, args } = getBridgeInvocation();
      return {
        command,
        args,
        clientConfigPaths: getAllClientConfigPaths(),
      };
    });

    ipcMain.respondTo(
      MCP_IPC.OpenConfigFile,
      (_event: unknown, filePath: string) => {
        // Reveal the file (or its parent folder, if the file doesn't exist).
        void shell.showItemInFolder(filePath);
        return undefined;
      }
    );

    ipcMain.respondTo(
      MCP_IPC.InstallInClient,
      async (_event: unknown, client: AiClientId) => {
        const { command, args } = getBridgeInvocation();
        return await installInClient(client, command, args);
      }
    );

    ipcMain.respondTo(
      MCP_IPC.UninstallFromClient,
      async (_event: unknown, client: AiClientId) => {
        await uninstallFromClient(client);
        return undefined;
      }
    );

    ipcMain.respondTo(
      MCP_IPC.DetectInClient,
      async (_event: unknown, client: AiClientId) => {
        const { command, args } = getBridgeInvocation();
        return await detectInClient(client, command, args);
      }
    );

    if (preferences.getPreferences().enableMcpServer) {
      await startServer();
    }

    preferences.onPreferenceValueChanged(
      'enableMcpServer',
      async (enabled: boolean) => {
        if (enabled) {
          await startServer();
        } else {
          await stopServer();
        }
      }
    );
  }

  static async onExit(): Promise<void> {
    if (!this.socketServer) return;
    try {
      await this.socketServer.close();
      this.socketServer = null;
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_453),
        'MCP Server',
        'Error stopping MCP server on exit',
        { error: (err as Error).message }
      );
    }
  }
}
