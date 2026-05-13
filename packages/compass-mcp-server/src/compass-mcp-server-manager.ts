import crypto from 'crypto';
import { app, BrowserWindow, shell } from 'electron';
import { ipcMain } from 'hadron-ipc';
import { createLogger, mongoLogId } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';
import { startMcpServer } from './index';
import type { CompassMcpServerHandle } from './index';
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
  // In a packaged app, `process.execPath` is the user-facing Compass binary
  // that already knows where its main script lives.
  //
  // In dev mode (`npm start`) `process.execPath` is the raw Electron
  // framework binary; passing only `--mcp-stdio` opens an empty Electron,
  // so we also forward `process.argv[1]` — the path the running Electron
  // was launched with — which is the bundled main.js.
  const args = app.isPackaged
    ? ['--mcp-stdio']
    : [process.argv[1], '--mcp-stdio'];
  return { command: process.execPath, args };
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
  private static handle: CompassMcpServerHandle | null = null;
  private static lastError: string | undefined;

  static async init(
    preferences: PreferencesAccess,
    connectionStorage: McpConnectionStorage
  ): Promise<void> {
    let token = preferences.getPreferences().mcpServerToken;
    if (!token) {
      token = crypto.randomBytes(32).toString('base64url');
      await preferences.savePreferences({ mcpServerToken: token });
    }

    const capturedToken = token;

    const buildOpts = () => ({
      token: capturedToken,
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
      requestAccessFromUI: (
        connectionId: string,
        connectionName: string
      ): Promise<ConsentResult> => {
        const requestId = crypto.randomUUID();
        return new Promise((resolve) => {
          const timer = setTimeout(() => {
            ipcMain.removeAllListeners(`mcp:consent-response:${requestId}`);
            resolve({ access: { mode: 'denied' }, remember: false });
          }, 60_000);

          ipcMain.once(
            `mcp:consent-response:${requestId}`,
            (_event: unknown, response: ConsentResult) => {
              clearTimeout(timer);
              resolve(response);
            }
          );

          ipcMain.broadcast('mcp:consent-request', {
            requestId,
            connectionId,
            connectionName,
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
        ipcMain.broadcast('mcp:open-collection', {
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
    });

    const startServer = async (): Promise<void> => {
      if (this.handle) return;
      try {
        this.handle = await startMcpServer(buildOpts());
        this.lastError = undefined;
        log.info(
          mongoLogId(1_001_000_450),
          'MCP Server',
          'MCP server started',
          { url: this.handle.url }
        );
        ipcMain.broadcast('mcp:status-update', { status: 'running' });
      } catch (err) {
        log.error(
          mongoLogId(1_001_000_451),
          'MCP Server',
          'Failed to start MCP server',
          { error: (err as Error).message }
        );
        this.lastError = (err as Error).message;
        ipcMain.broadcast('mcp:status-update', {
          status: 'error',
          error: this.lastError,
        });
      }
    };

    const stopServer = async (): Promise<void> => {
      if (!this.handle) return;
      try {
        await this.handle.stop();
        this.handle = null;
        this.lastError = undefined;
        ipcMain.broadcast('mcp:status-update', { status: 'stopped' });
      } catch (err) {
        log.error(
          mongoLogId(1_001_000_452),
          'MCP Server',
          'Error stopping MCP server',
          { error: (err as Error).message }
        );
      }
    };

    ipcMain.respondTo('mcp:get-status', () => {
      if (this.handle) return { status: 'running' };
      if (this.lastError) return { status: 'error', error: this.lastError };
      return { status: 'stopped' };
    });

    ipcMain.respondTo('mcp:get-bridge-info', () => {
      const { command, args } = getBridgeInvocation();
      return {
        command,
        args,
        clientConfigPaths: getAllClientConfigPaths(),
      };
    });

    ipcMain.respondTo(
      'mcp:open-config-file',
      (_event: unknown, filePath: string) => {
        // Reveal the file (or its parent folder, if the file doesn't exist).
        void shell.showItemInFolder(filePath);
        return undefined;
      }
    );

    ipcMain.respondTo(
      'mcp:install-in-client',
      async (_event: unknown, client: AiClientId) => {
        const { command, args } = getBridgeInvocation();
        return await installInClient(client, command, args);
      }
    );

    ipcMain.respondTo(
      'mcp:uninstall-from-client',
      async (_event: unknown, client: AiClientId) => {
        await uninstallFromClient(client);
        return undefined;
      }
    );

    ipcMain.respondTo(
      'mcp:detect-in-client',
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
    if (!this.handle) return;
    try {
      await this.handle.stop();
      this.handle = null;
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
