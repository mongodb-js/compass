import fs from 'fs/promises';
import net from 'net';
import path from 'path';
import {
  TransportRunnerBase,
  UserConfigSchema,
  type UserConfig,
} from 'mongodb-mcp-server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CompassConnectionManager,
  type CompassConnectionManagerOptions,
} from './compass-connection-manager';
import type { CompassToolContext } from './compass-tool-context';
import { COMPASS_TOOLS } from './compass-tools';
import { getMcpSocketPath } from './socket-path';
import { buildToolContext } from './build-tool-context';
import { compassConnectionErrorHandler } from './connection-error-handler';
import { installCompassMcpInstructions } from './instructions';
import { SavedQueryPromptsRegistry } from './saved-query-prompts';

// Patch upstream `TransportRunnerBase.getInstructions` so AI clients receive
// our Compass-specific workflow guidance in the MCP `initialize` response.
// Idempotent; runs once on module load.
installCompassMcpInstructions();

export interface CompassSocketServerOptions
  extends CompassConnectionManagerOptions {
  /** Returns all stored Compass connections for the list-connections tool. */
  getAllConnections: CompassToolContext['getAllConnections'];
  /** Asks the renderer to open a collection in a workspace tab. */
  openCollection: CompassToolContext['openCollection'];
  /** Catalog of saved queries / aggregations, surfaced to the AI. */
  listSavedQueries: CompassToolContext['listSavedQueries'];
  /** Persist a new saved query (FavoriteQuery). */
  saveSavedQuery: CompassToolContext['saveSavedQuery'];
  /** Persist a new saved aggregation (SavedPipeline). */
  saveSavedAggregation: CompassToolContext['saveSavedAggregation'];
}

/**
 * Listens on a local Unix socket / Windows named pipe and speaks the MCP
 * stdio protocol over each accepted connection. Same-user filesystem
 * permissions are the only authentication — no bearer token is required.
 *
 * Each connection gets its own MCP Server with a fresh CompassConnectionManager,
 * matching the per-session isolation we have on the HTTP transport.
 */
export class CompassSocketServer extends TransportRunnerBase<
  UserConfig,
  CompassToolContext
> {
  private socketServer?: net.Server;
  private readonly socketPath: string;
  private readonly opts: CompassSocketServerOptions;

  constructor(opts: CompassSocketServerOptions) {
    super({
      userConfig: UserConfigSchema.parse({
        transport: 'stdio',
        // Per-call gate enforces the active connection's preset (see
        // compass-tools.ts + aggregateStageGate). Running with
        // readOnly:false here so the full-access preset works end-to-end;
        // restrictive presets reject writes at our gate.
        readOnly: false,
        loggers: ['mcp'],
        telemetry: 'disabled',
        disabledTools: ['switch-connection'],
      }),
    });
    this.opts = opts;
    this.socketPath = getMcpSocketPath();
  }

  async start(): Promise<void> {
    await this.prepareSocketPath();

    this.socketServer = net.createServer((socket) => {
      void this.handleConnection(socket);
    });

    await new Promise<void>((resolve, reject) => {
      this.socketServer!.once('error', reject);
      this.socketServer!.listen(this.socketPath, () => {
        this.socketServer!.off('error', reject);
        resolve();
      });
    });
  }

  get path(): string {
    return this.socketPath;
  }

  async closeTransport(): Promise<void> {
    const server = this.socketServer;
    this.socketServer = undefined;
    if (!server) return;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await this.cleanupSocketPath();
  }

  private async handleConnection(socket: net.Socket): Promise<void> {
    const connectionManager = new CompassConnectionManager({
      getConnectionInfo: this.opts.getConnectionInfo,
      checkAccess: this.opts.checkAccess,
      requestAccessFromUI: this.opts.requestAccessFromUI,
      saveAccess: this.opts.saveAccess,
    });

    // Forward-declared so the save-wrappers (built before createServer
    // returns the mcpServer instance) can reach the registry by closure
    // once it exists. Reads of `promptsRegistry` only happen inside async
    // save handlers, which fire well after `await this.createServer(...)`
    // assigns the variable.
    let promptsRegistry: SavedQueryPromptsRegistry | undefined;

    const refreshPromptsAfter = async <T>(p: Promise<T>): Promise<T> => {
      const result = await p;
      if (promptsRegistry) {
        try {
          await promptsRegistry.refresh();
        } catch {
          // Never let a prompt-refresh failure surface as a save failure.
          // The next session will reconcile on initial refresh.
        }
      }
      return result;
    };

    // Wrap the catalog-write methods so a successful save kicks the
    // prompts registry. Reads (`listSavedQueries`) are unaffected.
    const wrappedOpts: CompassSocketServerOptions = {
      ...this.opts,
      saveSavedQuery: (input) =>
        refreshPromptsAfter(this.opts.saveSavedQuery(input)),
      saveSavedAggregation: (input) =>
        refreshPromptsAfter(this.opts.saveSavedAggregation(input)),
    };

    try {
      const server = await this.createServer({
        serverOptions: {
          tools: COMPASS_TOOLS,
          toolContext: buildToolContext(connectionManager, wrappedOpts),
          telemetryProperties: { hosting_mode: 'compass' },
        },
        sessionOptions: {
          connectionManager,
          connectionErrorHandler: compassConnectionErrorHandler,
        },
      });

      // Mirror the saved-queries catalog onto the MCP prompts surface so
      // items with `mcpPromptName` show up as slash commands in AI
      // clients. Initial refresh runs BEFORE we connect the transport so
      // the prompts list is populated by the time the client sends
      // `initialize`.
      promptsRegistry = new SavedQueryPromptsRegistry(
        server.mcpServer,
        this.opts.listSavedQueries
      );
      await promptsRegistry.refresh();

      // A net.Socket is both Readable and Writable, so we can hand it
      // straight to StdioServerTransport in place of process.stdin/stdout.
      const transport = new StdioServerTransport(socket, socket);
      await server.connect(transport);

      const cleanup = () => {
        void server.close();
      };
      socket.once('close', cleanup);
      socket.once('error', cleanup);
    } catch (err) {
      socket.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private async prepareSocketPath(): Promise<void> {
    if (process.platform === 'win32') return; // Named pipes need no path setup.
    const dir = path.dirname(this.socketPath);
    await fs.mkdir(dir, { recursive: true });
    // Remove any stale socket file from a previous (possibly crashed) run.
    await fs.rm(this.socketPath, { force: true });
  }

  private async cleanupSocketPath(): Promise<void> {
    if (process.platform === 'win32') return;
    await fs.rm(this.socketPath, { force: true });
  }
}
