import crypto from 'crypto';
import { ipcMain } from 'hadron-ipc';
import { createLogger, mongoLogId } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';
import { startMcpServer } from './index';
import type { CompassMcpServerHandle } from './index';

const { log } = createLogger('COMPASS-MCP');

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
            `mcp:consent-response:${requestId}` as never,
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
