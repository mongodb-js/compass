import net from 'net';
import { getMcpSocketPath } from './socket-path';

/**
 * Runs the MCP stdio bridge: a thin pipe that forwards bytes between this
 * process's stdio and the local Compass-GUI MCP socket.
 *
 * Both sides speak newline-delimited JSON-RPC, so the bridge does not parse
 * any messages — it just shuffles bytes.
 *
 * If the Compass GUI is not running, the bridge surfaces a minimal MCP server
 * that exposes a single tool explaining the situation, so AI clients (Claude
 * Desktop, Cursor, etc.) get a useful message rather than a generic error.
 *
 * The bridge process exits when either side closes the connection.
 */
export async function runStdioBridge(): Promise<void> {
  const socketPath = getMcpSocketPath();

  const socket = await connectOrFallback(socketPath);

  if (!socket) {
    // Compass GUI is not reachable: run a minimal in-process fallback that
    // tells the AI client to start Compass.
    runFallbackServer();
    return;
  }

  // Wire stdio <-> socket. Use { end: false } so closing one side doesn't
  // immediately tear down the other, letting drains complete cleanly.
  process.stdin.pipe(socket);
  socket.pipe(process.stdout);

  const exit = (code: number) => {
    try {
      socket.end();
    } catch {
      /* noop */
    }
    process.exit(code);
  };

  socket.on('close', () => exit(0));
  socket.on('error', () => exit(1));
  process.stdin.on('end', () => exit(0));

  // Resume stdin in case it's paused.
  process.stdin.resume();

  // Block until something exits us.
  await new Promise<never>(() => {
    /* noop */
  });
}

function connectOrFallback(socketPath: string): Promise<net.Socket | null> {
  return new Promise((resolve) => {
    const socket = net.connect(socketPath);
    socket.once('connect', () => resolve(socket));
    socket.once('error', () => resolve(null));
  });
}

/**
 * When the bridge cannot reach the Compass GUI we still need to speak MCP on
 * stdio — Claude Desktop and Cursor expect a valid `initialize` response —
 * otherwise the user sees the "MCP server could not be loaded" toast.
 *
 * We answer a minimal protocol handshake and expose one tool whose only job
 * is to explain that Compass is not running. This keeps the AI client happy
 * and gives the user an actionable message.
 */
function runFallbackServer(): void {
  const MESSAGE =
    'MongoDB Compass is not running, so no connections are available. Start ' +
    'Compass and enable the MCP server in Settings → Artificial Intelligence, ' +
    'then ask me again.';

  type JsonRpcRequest = {
    jsonrpc: '2.0';
    id?: number | string | null;
    method: string;
    params?: unknown;
  };

  const send = (msg: Record<string, unknown>): void => {
    process.stdout.write(JSON.stringify(msg) + '\n');
  };

  const handle = (req: JsonRpcRequest): void => {
    if (req.method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id: req.id ?? null,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'mongodb-compass',
            version: '0.0.0',
          },
          instructions: MESSAGE,
        },
      });
      return;
    }
    if (req.method === 'tools/list') {
      send({
        jsonrpc: '2.0',
        id: req.id ?? null,
        result: {
          tools: [
            {
              name: 'compass-status',
              description: MESSAGE,
              inputSchema: { type: 'object', properties: {} },
            },
          ],
        },
      });
      return;
    }
    if (req.method === 'tools/call') {
      send({
        jsonrpc: '2.0',
        id: req.id ?? null,
        result: {
          content: [{ type: 'text', text: MESSAGE }],
        },
      });
      return;
    }
    // Notifications have no id — silently ignore.
    if (req.id !== undefined && req.id !== null) {
      send({
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32601, message: 'Method not found' },
      });
    }
  };

  let buffer = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk: string) => {
    buffer += chunk;
    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const req = JSON.parse(line) as JsonRpcRequest;
        handle(req);
      } catch {
        /* malformed line — ignore */
      }
    }
  });
  process.stdin.on('end', () => process.exit(0));
  process.stdin.resume();
}
