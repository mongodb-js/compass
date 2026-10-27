import { TransportRunnerBase } from 'mongodb-mcp-server';
import type {
  Server,
  TransportRunnerConfig,
  UserConfig,
} from 'mongodb-mcp-server';

/**
 * In-memory MCP runner that doesn't bind to any external transport.
 * The server is kept in memory for direct programmatic access.
 */
export class InMemoryRunner extends TransportRunnerBase {
  public server?: Server;
  public readonly userConfig: UserConfig;

  constructor(config: TransportRunnerConfig) {
    super(config);
    this.userConfig = config.userConfig;
  }

  async start(): Promise<void> {
    this.server = await this.setupServer();
  }

  async closeTransport(): Promise<void> {
    await this.server?.close();
  }
}
