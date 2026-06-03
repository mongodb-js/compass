import fs from 'fs/promises';
import net from 'net';
import path from 'path';
import os from 'os';
import { expect } from 'chai';
import sinon from 'sinon';
import { CompassSocketServer } from '../compass-socket-server';

// End-to-end smoke test: stand up the real CompassSocketServer with stubbed
// Compass dependencies, open a raw socket connection, drive the MCP
// `initialize` handshake over newline-delimited JSON, and confirm:
//
//   - the socket file exists while the server is up
//   - JSON-RPC framing round-trips
//   - the upstream MCP server actually replies on the wire
//   - the response carries our COMPASS_INSTRUCTIONS (proves the monkey-patch
//     installed in compass-socket-server's module-load fired correctly)
//   - the socket file is cleaned up on close()
//
// We don't drive `tools/call` here — that would require booting a real
// MongoDB-shaped service provider; the per-tool spec covers that surface.

const NULL_LOG = () => undefined;

function makeOpts() {
  return {
    getAllConnections: sinon.stub().resolves([]),
    openCollection: sinon.stub(),
    getConnectionInfo: sinon.stub().resolves(undefined),
    checkAccess: sinon.stub().resolves({ mode: 'ask' as const }),
    requestAccessFromUI: sinon.stub().resolves({
      access: { mode: 'denied' as const },
      remember: false,
    }),
    saveAccess: sinon.stub().resolves(),
    // Saved-queries catalog stubs — the prompts registry calls
    // listSavedQueries during initial refresh; save methods aren't
    // exercised here but must be provided to satisfy the type.
    listSavedQueries: sinon.stub().resolves([]),
    saveSavedQuery: sinon.stub().resolves({ id: 'noop' }),
    saveSavedAggregation: sinon.stub().resolves({ id: 'noop' }),
  };
}

// Override the socket path for tests so we don't collide with real Compass
// or pollute the real runtime dir. We do this by temporarily moving
// XDG_RUNTIME_DIR / HOME so getMcpSocketPath() resolves under a tempdir.
async function withTempEnv<T>(fn: () => Promise<T>): Promise<T> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'compass-mcp-spec-'));
  const prev = {
    XDG_RUNTIME_DIR: process.env.XDG_RUNTIME_DIR,
    HOME: process.env.HOME,
    TMPDIR: process.env.TMPDIR,
  };
  process.env.XDG_RUNTIME_DIR = tmp;
  process.env.HOME = tmp;
  process.env.TMPDIR = tmp;
  try {
    return await fn();
  } finally {
    process.env.XDG_RUNTIME_DIR = prev.XDG_RUNTIME_DIR;
    process.env.HOME = prev.HOME;
    process.env.TMPDIR = prev.TMPDIR;
    await fs.rm(tmp, { recursive: true, force: true }).catch(NULL_LOG);
  }
}

describe('CompassSocketServer (integration)', function () {
  // Slow-ish because we boot the real upstream MCP server.
  this.timeout(10_000);

  if (process.platform === 'win32') {
    // Named pipes can be exercised here too but the env-override trick we
    // use is POSIX-specific. Skip on Windows for now — Unix coverage gives
    // us most of the confidence.
    it.skip('skipped on Windows (named-pipe variant has its own code path)');
    return;
  }

  it('listens on a socket path and removes it on close', async function () {
    await withTempEnv(async () => {
      const server = new CompassSocketServer(makeOpts());
      await server.start();
      const exists = await fs
        .stat(server.path)
        .then((s) => s.isSocket())
        .catch(() => false);
      expect(exists).to.equal(true);
      await server.close();
      const removed = await fs
        .stat(server.path)
        .then(() => false)
        .catch(() => true);
      expect(removed).to.equal(true);
    });
  });

  it('accepts a socket connection and replies to an MCP initialize request', async function () {
    await withTempEnv(async () => {
      const server = new CompassSocketServer(makeOpts());
      await server.start();
      try {
        // newline-delimited JSON is what `StdioServerTransport` expects.
        const reply = await sendInitialize(server.path, 'compass-mcp-spec');
        expect(reply.jsonrpc).to.equal('2.0');
        expect(reply.id).to.equal(1);
        // Initialize result carries the patched instructions string.
        expect(reply.result?.serverInfo).to.exist;
        expect(reply.result?.instructions).to.be.a('string');
        expect(reply.result?.instructions).to.match(/list-connections/);
        expect(reply.result?.instructions).to.match(/connection string/);
      } finally {
        await server.close();
      }
    });
  });
});

// Connect to `socketPath`, send a single `initialize` request, parse the
// first JSON-RPC response, and return it. Trims to a 5s budget so a wedge
// fails the test instead of hanging the suite.
function sendInitialize(
  socketPath: string,
  clientName: string
): Promise<{
  jsonrpc: string;
  id: number;
  result?: {
    serverInfo?: { name?: string };
    instructions?: string;
  };
  error?: unknown;
}> {
  return new Promise((resolve, reject) => {
    const sock = net.createConnection(socketPath);
    let buffer = '';
    const timer = setTimeout(() => {
      sock.destroy();
      reject(new Error('initialize timed out'));
    }, 5_000);
    sock.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    sock.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const newlineIdx = buffer.indexOf('\n');
      if (newlineIdx === -1) return;
      const line = buffer.slice(0, newlineIdx);
      clearTimeout(timer);
      try {
        const parsed = JSON.parse(line) as Awaited<
          ReturnType<typeof sendInitialize>
        >;
        sock.end();
        resolve(parsed);
      } catch (err) {
        sock.destroy();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        // Matches what AI clients send. The `clientInfo.name` flows into our
        // CompassConnectionManager.clientName field.
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: clientName, version: '0.0.0-test' },
      },
    };
    sock.write(JSON.stringify(request) + '\n');
  });
}
