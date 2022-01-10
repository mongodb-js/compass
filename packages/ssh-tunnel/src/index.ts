import { promisify } from 'util';
import { EventEmitter, once } from 'events';
import { createServer, Server, Socket } from 'net';
import { Client as SshClient, ClientChannel, ConnectConfig } from 'ssh2';

type ForwardOutConfig = {
  srcAddr: string;
  srcPort: number;
  dstAddr: string;
  dstPort: number;
};

type LocalProxyServerConfig = {
  localAddr: string;
  localPort: number;
};

type ErrorWithOrigin = Error & { origin?: string };

export type SshTunnelConfig = ConnectConfig &
  ForwardOutConfig &
  LocalProxyServerConfig;

function getConnectConfig(config: Partial<SshTunnelConfig>): ConnectConfig {
  const {
    // Doing it the other way around would be too much
    /* eslint-disable @typescript-eslint/no-unused-vars */
    srcAddr,
    srcPort,
    dstAddr,
    dstPort,
    localAddr,
    localPort,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    ...connectConfig
  } = config;

  return connectConfig;
}

function getSshTunnelConfig(config: Partial<SshTunnelConfig>): SshTunnelConfig {
  const connectConfig = { port: 22, ...getConnectConfig(config) };

  return Object.assign(
    {},
    {
      srcPort: 0,
      srcAddr: '127.0.0.1',
      dstAddr: '127.0.0.1',
      dstPort: connectConfig.port,
    },
    {
      localAddr: '127.0.0.1',
      localPort: 0,
    },
    config
  );
}

export class SshTunnel extends EventEmitter {
  private connections: Set<Socket> = new Set();
  private server: Server;
  private rawConfig: SshTunnelConfig;
  private sshClient: SshClient;
  private serverListen: (port?: number, host?: string) => Promise<void>;
  private serverClose: () => Promise<void>;
  private forwardOut: (
    srcIP: string,
    srcPort: number,
    dstIP: string,
    dstPort: number
  ) => Promise<ClientChannel>;

  constructor(config: Partial<SshTunnelConfig> = {}) {
    super();

    this.rawConfig = getSshTunnelConfig(config);

    this.sshClient = new SshClient();

    this.forwardOut = promisify(this.sshClient.forwardOut.bind(this.sshClient));

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.server = createServer(async (socket) => {
      this.connections.add(socket);

      socket.on('error', (err: ErrorWithOrigin) => {
        err.origin = err.origin ?? 'connection';
        this.server.emit('error', err);
      });

      socket.once('close', () => {
        this.connections.delete(socket);
      });

      try {
        const { srcAddr, srcPort, dstAddr, dstPort } = this.rawConfig;

        const channel = await this.forwardOut(
          srcAddr,
          srcPort,
          dstAddr,
          dstPort
        );

        socket.pipe(channel).pipe(socket);
      } catch (err) {
        (err as any).origin = 'ssh-client';
        socket.destroy(err as Error);
      }
    });

    this.serverListen = promisify(this.server.listen.bind(this.server));

    this.serverClose = promisify(this.server.close.bind(this.server));

    (['close', 'connection', 'error', 'listening'] as const).forEach(
      (eventName) => {
        this.server.on(eventName, this.emit.bind(this, eventName));
      }
    );
  }

  get config(): SshTunnelConfig {
    const serverAddress = this.server.address();

    return {
      ...this.rawConfig,
      localPort:
        (typeof serverAddress !== 'string' && serverAddress?.port) ||
        this.rawConfig.localPort,
    };
  }

  async listen(): Promise<void> {
    const { localPort, localAddr } = this.rawConfig;

    await this.serverListen(localPort, localAddr);

    try {
      await Promise.race([
        once(this.sshClient, 'error').then(([err]) => {
          throw err;
        }),
        (() => {
          const waitForReady = once(this.sshClient, 'ready') as Promise<[void]>;
          this.sshClient.connect(getConnectConfig(this.rawConfig));
          return waitForReady;
        })(),
      ]);
    } catch (err) {
      await this.serverClose();
      throw err;
    }
  }

  async close(): Promise<void> {
    const [maybeError] = await Promise.all([
      // If we catch anything, just return the error instead of throwing, we
      // want to await on closing the connections before re-throwing server
      // close error
      this.serverClose().catch<Error>((e) => e),
      this.closeSshClient(),
      this.closeOpenConnections(),
    ]);

    if (maybeError) {
      throw maybeError;
    }
  }

  private async closeSshClient() {
    try {
      return once(this.sshClient, 'close');
    } finally {
      this.sshClient.end();
    }
  }

  private async closeOpenConnections() {
    const waitForClose: Promise<unknown[]>[] = [];
    this.connections.forEach((socket) => {
      waitForClose.push(once(socket, 'close'));
      socket.destroy();
    });
    await Promise.all(waitForClose);
    this.connections.clear();
  }
}

export default SshTunnel;
