import { Server as SSHServer, ServerConfig } from 'ssh2';
import { createServer, Server as HttpServer } from 'http';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import path from 'path';
import { AddressInfo, Socket } from 'net';
import fetch from 'node-fetch';
import { expect } from 'chai';

import SSHTunnel, { SshTunnelConfig } from './index';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let sshServer: SSHServer, httpServer: HttpServer, sshTunnel: SSHTunnel;

function createTestHttpServer(): Promise<void> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    httpServer = createServer(async (req, res) => {
      if (req.url === '/error') {
        res.statusCode = 500;
        res.end('Error');
      } else if (req.url === '/wait') {
        await sleep(500);
        res.end('Waited 500ms');
      } else {
        res.end('Hello from http server');
      }
    });
    httpServer.listen(0, 'localhost', () => {
      resolve();
    });
  });
}

async function stopTestHttpServer() {
  try {
    await promisify(httpServer.close.bind(httpServer))();
    (httpServer as unknown) = null;
  } catch {
    // noop
  }
}

function createTestSshServer(
  config: Partial<ServerConfig> = {}
): Promise<void> {
  return new Promise((resolve) => {
    const key = path.resolve(__dirname, '..', 'test', 'fixtures', 'rsa');
    sshServer = new SSHServer(
      {
        hostKeys: [readFileSync(key)],
        ...config,
      },
      (client) => {
        client
          .on('authentication', (ctx) => {
            ctx.accept();
          })
          .on('ready', () => {
            client.on('tcpip', (accept, _reject, { destPort, destIP }) => {
              const channel = accept();
              const connection = new Socket();
              channel.pipe(connection).pipe(channel);
              connection.connect(destPort, destIP);
            });
          });
      }
    );
    sshServer.listen(0, 'localhost', () => resolve());
  });
}

async function stopTestSshServer() {
  try {
    await promisify(sshServer.close.bind(sshServer))();
    (sshServer as unknown) = null;
  } catch {
    // noop
  }
}

async function createTestSshTunnel(config: Partial<SshTunnelConfig> = {}) {
  sshTunnel = new SSHTunnel({
    username: 'user',
    port: sshServer.address().port,
    dstPort: (httpServer.address() as AddressInfo).port,
    localPort: 0,
    ...config,
  });
  await sshTunnel.listen();
}

async function stopTestSshTunnel() {
  try {
    await sshTunnel.close();
    (sshTunnel as unknown) = null;
  } catch {
    // noop
  }
}

function getLocalServerHost() {
  const { localAddr, localPort } = sshTunnel.config;
  return `http://${localAddr}:${localPort}`;
}

describe('SSHTunnel', function () {
  beforeEach(async function () {
    await createTestSshServer();
    await createTestHttpServer();
  });

  afterEach(async function () {
    await stopTestSshTunnel();
    await stopTestSshServer();
    await stopTestHttpServer();
  });

  it('should be main export', function () {
    expect(new SSHTunnel()).to.be.instanceof(SSHTunnel);
  });

  it('creates a tunnel that allows to request remote server through an ssh server', async function () {
    await createTestSshTunnel();

    const res = await fetch(getLocalServerHost());
    expect(await res.text()).to.equal('Hello from http server');
  });

  it('closes any connections on tunnel close', async function () {
    await createTestSshTunnel();

    try {
      await Promise.all([
        fetch(`${getLocalServerHost()}/wait`),
        (async () => {
          await sleep(50);
          await sshTunnel.close();
        })(),
      ]);
      expect.fail('missed exception');
    } catch (err) {
      expect(err.message).to.match(/socket hang up/);
    }
  });

  it('fails on listen call if ssh server is not available', async function () {
    try {
      await createTestSshTunnel({
        host: 'nonexistent-ssh-server.test',
        port: 4242,
      });
      expect.fail('missed exception');
    } catch (err) {
      expect(err.message).to.equal(
        'getaddrinfo ENOTFOUND nonexistent-ssh-server.test'
      );
    }
  });

  it('stops http server if encountered an error connecting to ssh server', async function () {
    try {
      await createTestSshTunnel({
        host: 'nonexistent-ssh-server.test',
        port: 4242,
      });
      expect.fail('missed exception');
    } catch {
      expect(sshTunnel['server'].listening).to.equal(false);
    }
  });
});
