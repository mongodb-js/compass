import type { HadronIpcMain } from 'hadron-ipc';
import { ipcMain } from 'hadron-ipc';
import { createLogger, mongoLogId } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';

const { log } = createLogger('COMPASS-ATLAS-SERVICE');

export class MCPServiceMain {
  private static serverList = new Map<string, unknown>();
  private static initDone = false;
  private static preferences: PreferencesAccess;

  private constructor() {
    // singleton
  }

  private static ipcMain:
    | Pick<HadronIpcMain, 'createHandle' | 'handle' | 'broadcast'>
    | undefined = ipcMain;

  static async init(preferences: PreferencesAccess): Promise<void> {
    this.preferences = preferences;
    if (!this.initDone) {
      if (this.ipcMain) {
        this.ipcMain.createHandle('MCPService', this, ['setupNewConnection']);
      }
      log.info(
        mongoLogId(1_001_000_353),
        'MCPService',
        'MCP service initialized'
      );
    }
  }

  static async setupNewConnection({
    cs,
    connId,
    telemetry,
  }: {
    cs: string;
    connId: string;
    telemetry: boolean;
  }): Promise<boolean> {
    if (this.serverList.has(connId)) {
      return Promise.resolve(true);
    }

    const options = {
      MDB_MCP_TELEMETRY: telemetry ? 'enabled' : 'disabled',
      MDB_MCP_CONNECTION_STRING: cs,
    };

    log.info(
      mongoLogId(1_001_000_354),
      'MCPService',
      'Setting up new connection with options',
      {
        connId,
        telemetry,
      }
    );

    try {
      // TODO: MCP package should expose a programmatic API to instantiate the server
      // instead of doing this. Failure to connect to the server crashes Compass.
      process.env.MDB_MCP_TELEMETRY = options.MDB_MCP_TELEMETRY;
      process.env.MDB_MCP_CONNECTION_STRING = options.MDB_MCP_CONNECTION_STRING;
      const server = await import('mongodb-mcp-server');
      this.serverList.set(connId, server);
      log.info(mongoLogId(1_001_000_355), 'MCPService', 'MCP server created', {
        connId,
        telemetry,
      });
      return Promise.resolve(true);
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_356),
        'MCPService',
        'Error creating MCP server',
        {
          connId,
          telemetry,
          error: (error as Error).message,
        }
      );
      return Promise.reject(error);
    } finally {
      delete process.env.MDB_MCP_TELEMETRY;
      delete process.env.MDB_MCP_CONNECTION_STRING;
    }
  }
}
