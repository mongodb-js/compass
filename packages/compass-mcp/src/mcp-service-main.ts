import type { HadronIpcMain } from 'hadron-ipc';
import { ipcMain } from 'hadron-ipc';
import { createLogger, mongoLogId } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';
import { Ollama } from 'ollama';

const { log } = createLogger('COMPASS-ATLAS-SERVICE');

export class MCPServiceMain {
  private static serverList = new Map<string, unknown>();
  private static sessionList = new Map<string, Ollama>();
  private static initDone = false;
  private static preferences: PreferencesAccess;
  private static aiModel: Ollama;

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
        this.ipcMain.createHandle('MCPService', this, [
          'setupNewConnection',
          'startChatSession',
          'sendChatMessage',
        ]);
      }
      const { aiModelPath } = this.preferences.getPreferences();
      if (!aiModelPath) {
        log.info(
          mongoLogId(1_001_000_357),
          'MCPService',
          'Model not set, skipping loading model'
        );
        return;
      }
      const ollama = new Ollama();
      try {
        const data = await ollama.chat({
          model: 'deepseek-r1:7b',
          format: 'json',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant.',
            },
            {
              role: 'user',
              content: 'You are a MongoDB Compass assistant.',
            },
          ],
        });
        // eslint-disable-next-line
        console.log('Model loaded successfully', data);
      } catch (error) {
        // eslint-disable-next-line
        console.error(
          mongoLogId(1_001_000_359),
          'MCPService',
          'Error loading model',
          {
            error: (error as Error).message,
            aiModelPath,
          }
        );
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

  static async startChatSession({
    connId,
  }: {
    connId: string;
  }): Promise<boolean> {
    const server = this.serverList.get(connId);
    if (!server) {
      throw new Error(`No server found for connection id ${connId}`);
    }
    if (!this.sessionList.has(connId)) {
      const ollama = new Ollama();
      try {
        await ollama.chat({
          model: 'deepseek-r1:7b',
          format: 'json',
          messages: [
            {
              role: 'system',
              content:
                'You are a MongoDB Compass assistant, helping users with their data.',
            },
          ],
        });
        this.sessionList.set(connId, ollama);
        log.info(
          mongoLogId(1_001_000_358),
          'MCPService',
          'MCP chat session created',
          {
            connId,
          }
        );
      } catch (error) {
        log.error(
          mongoLogId(1_001_000_360),
          'MCPService',
          'Error creating chat session',
          {
            connId,
            error: (error as Error).message,
          }
        );
        return Promise.reject(error);
      }
    }
    return Promise.resolve(true);
  }

  static async sendChatMessage({
    connId,
    message,
  }: {
    connId: string;
    message: string;
  }): Promise<any> {
    const ollama = this.sessionList.get(connId);
    if (!ollama) {
      throw new Error(`No chat session found for connection id ${connId}`);
    }

    try {
      const response = await ollama.chat({
        model: 'deepseek-r1:7b',
        format: 'json',
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      });

      log.info(
        mongoLogId(1_001_000_361),
        'MCPService',
        'Received chat response',
        {
          connId,
        }
      );

      return Promise.resolve(response);
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_362),
        'MCPService',
        'Error sending chat message',
        {
          connId,
          error: (error as Error).message,
        }
      );
      return Promise.reject(error);
    }
  }
}
