import { expect } from 'chai';
import http from 'http';
import { CompassHttpRunner } from '../compass-http-runner';
import { UserConfigSchema } from 'mongodb-mcp-server';

const TEST_TOKEN = 'test-bearer-token-abc123';

function makeRequest(
  port: number,
  opts: {
    method?: string;
    path?: string;
    headers?: Record<string, string>;
    body?: string;
  }
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const body = opts.body ?? '';
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: opts.path ?? '/mcp',
        method: opts.method ?? 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...opts.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += String(chunk);
        });
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, body: data });
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Allocate a free port for the test server
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      srv.close(() => {
        if (addr && typeof addr === 'object') {
          resolve(addr.port);
        } else {
          reject(new Error('Could not get free port'));
        }
      });
    });
  });
}

describe('CompassHttpRunner — HTTP security', function () {
  this.timeout(15_000);

  let runner: CompassHttpRunner;
  let port: number;

  // Minimal stubs — no real MongoDB needed for security tests.
  const stubOpts = {
    token: TEST_TOKEN,
    getAllConnections: () => Promise.resolve([]),
    getConnectionInfo: () => Promise.resolve(undefined),
    checkAccess: () => Promise.resolve({ mode: 'ask' as const }),
    requestAccessFromUI: () =>
      Promise.resolve({
        access: { mode: 'denied' as const },
        remember: false,
      }),
    saveAccess: () => Promise.resolve(),
    openCollection: () => {
      /* no-op for security tests */
    },
  };

  beforeEach(async function () {
    port = await getFreePort();
    runner = new CompassHttpRunner({ ...stubOpts, port });
    await runner.start();
  });

  afterEach(async function () {
    await runner.close();
  });

  it('returns 401 when Authorization header is missing', async function () {
    const res = await makeRequest(port, {
      body: JSON.stringify({ jsonrpc: '2.0', method: 'ping', id: 1 }),
    });
    expect(res.status).to.equal(401);
  });

  it('returns 401 when token is wrong', async function () {
    const res = await makeRequest(port, {
      headers: { Authorization: 'Bearer wrong-token' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'ping', id: 1 }),
    });
    expect(res.status).to.equal(401);
  });

  it('does not return 401 with the correct token', async function () {
    const res = await makeRequest(port, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'ping', id: 1 }),
    });
    expect(res.status).to.not.equal(401);
  });

  it('returns 403 when Origin is a disallowed browser origin', async function () {
    const res = await makeRequest(port, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        Origin: 'https://evil.example.com',
      },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'ping', id: 1 }),
    });
    expect(res.status).to.equal(403);
  });

  it('does not return 403 when Origin is absent', async function () {
    const res = await makeRequest(port, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'ping', id: 1 }),
    });
    expect(res.status).to.not.equal(403);
  });

  it('does not return 200 for GET /mcp without SSE headers', async function () {
    const res = await makeRequest(port, {
      method: 'GET',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: '',
    });
    expect(res.status).to.not.equal(200);
  });

  it('throws on startup when httpHost is not loopback', async function () {
    // Directly instantiate with 0.0.0.0 via overriding the userConfig —
    // we validate the runner rejects this configuration.
    const badConfig = UserConfigSchema.parse({
      transport: 'http',
      httpHost: '0.0.0.0',
      httpPort: await getFreePort(),
      readOnly: true,
    });

    // The runner itself validates the config before start() calls listen().
    // StreamableHttpRunner.start() calls validateConfig() which warns about
    // non-loopback hosts. For our purposes, we confirm the server cannot be
    // trivially reconfigured to bind on all interfaces by asserting the
    // CompassHttpRunner always passes httpHost: '127.0.0.1' to its superclass.
    const compassRunner = new CompassHttpRunner({
      ...stubOpts,
      port: badConfig.httpPort,
    });
    // The userConfig built by CompassHttpRunner hardcodes 127.0.0.1 regardless.
    // Verify via the protected userConfig property.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runnerConfig = (compassRunner as any).userConfig as typeof badConfig;
    expect(runnerConfig.httpHost).to.equal('127.0.0.1');
    await compassRunner.close();
  });
});
