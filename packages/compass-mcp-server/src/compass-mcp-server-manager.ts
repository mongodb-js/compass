import crypto from 'crypto';
import os from 'os';
import path from 'path';
import { app, shell } from 'electron';
import { ipcMain } from 'hadron-ipc';
import { createLogger, mongoLogId } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';
import { startMcpServer } from './index';
import type { CompassMcpServerHandle } from './index';

const { log } = createLogger('COMPASS-MCP');

/**
 * Absolute paths to the user-level (not workspace) MCP config file for each
 * supported AI client, on the current OS. Returned to the renderer so the
 * settings UI can show a "reveal in Finder/Explorer" link per client.
 */
function resolveClientConfigPaths(): {
  claude: string;
  cursor: string;
  vscode: string;
  windsurf: string;
} {
  const home = os.homedir();
  if (process.platform === 'win32') {
    const appData =
      process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return {
      claude: path.join(appData, 'Claude', 'claude_desktop_config.json'),
      cursor: path.join(home, '.cursor', 'mcp.json'),
      vscode: path.join(appData, 'Code', 'User', 'mcp.json'),
      windsurf: path.join(home, '.codeium', 'windsurf', 'mcp_config.json'),
    };
  }
  if (process.platform === 'darwin') {
    return {
      claude: path.join(
        home,
        'Library',
        'Application Support',
        'Claude',
        'claude_desktop_config.json'
      ),
      cursor: path.join(home, '.cursor', 'mcp.json'),
      vscode: path.join(
        home,
        'Library',
        'Application Support',
        'Code',
        'User',
        'mcp.json'
      ),
      windsurf: path.join(home, '.codeium', 'windsurf', 'mcp_config.json'),
    };
  }
  // linux / other unix
  const configHome = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  return {
    claude: path.join(configHome, 'Claude', 'claude_desktop_config.json'),
    cursor: path.join(home, '.cursor', 'mcp.json'),
    vscode: path.join(configHome, 'Code', 'User', 'mcp.json'),
    windsurf: path.join(home, '.codeium', 'windsurf', 'mcp_config.json'),
  };
}

export interface McpConnectionStorage {
  loadAll(): Promise<
    Array<{
      id: string;
      favorite?: { name?: string };
      connectionOptions: { connectionString: string };
      mcpAccess?: 'allowed' | 'denied';
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
          mcpAccess: c.mcpAccess,
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
      checkConsent: async (id: string) => {
        const connections = await connectionStorage.loadAll();
        const info = connections.find((c) => c.id === id);
        return info?.mcpAccess ?? 'ask';
      },
      requestConsentFromUI: (
        connectionId: string,
        connectionName: string
      ): Promise<{ decision: 'allowed' | 'denied'; remember: boolean }> => {
        const requestId = crypto.randomUUID();
        return new Promise((resolve) => {
          const timer = setTimeout(() => {
            ipcMain.removeAllListeners(`mcp:consent-response:${requestId}`);
            resolve({ decision: 'denied', remember: false });
          }, 60_000);

          ipcMain.once(
            `mcp:consent-response:${requestId}`,
            (
              _event: unknown,
              response: { decision: 'allowed' | 'denied'; remember: boolean }
            ) => {
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
      saveConsent: async (id: string, decision: 'allowed' | 'denied') => {
        const connections = await connectionStorage.loadAll();
        const info = connections.find((c) => c.id === id);
        if (info) {
          await connectionStorage.save({
            connectionInfo: { ...info, mcpAccess: decision },
          });
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
      // In a packaged app, `process.execPath` is the user-facing Compass
      // binary that already knows where its main script lives.
      //
      // In dev mode (`npm start`) `process.execPath` is the raw Electron
      // framework binary, and Electron was launched with the path to the
      // compiled main script as its first argv. `app.getAppPath()` is the
      // directory of that script (e.g. `packages/compass/build`), which on
      // its own does not contain a package.json, so passing it to a fresh
      // Electron would fail — but `process.argv[1]` IS that exact script
      // path, so we forward it verbatim.
      const args = app.isPackaged
        ? ['--mcp-stdio']
        : [process.argv[1], '--mcp-stdio'];
      return {
        command: process.execPath,
        args,
        clientConfigPaths: resolveClientConfigPaths(),
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
