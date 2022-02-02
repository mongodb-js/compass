import { promisify } from 'util';
import { EventEmitter, once } from 'events';
import type { Socket } from 'net';
import type { ClientChannel, ConnectConfig } from 'ssh2';
import { Client as SshClient } from 'ssh2';
import createDebug from 'debug';

// The socksv5 module is not bundle-able by itself, so we get the
// subpackages directly
import socks5Server from 'socksv5/lib/server';
import socks5AuthNone from 'socksv5/lib/auth/None';
import socks5AuthUserPassword from 'socksv5/lib/auth/UserPassword';

const debug = createDebug('mongodb:ssh-tunnel');

type LocalProxyServerConfig = {
  localAddr: string;
  localPort: number;
  socks5Username?: string;
  socks5Password?: string;
};

type ErrorWithOrigin = Error & { origin?: string };

export type SshTunnelConfig = ConnectConfig & LocalProxyServerConfig;

function getConnectConfig(config: Partial<SshTunnelConfig>): ConnectConfig {
  const {
    // Doing it the other way around would be too much
    /* eslint-disable @typescript-eslint/no-unused-vars */
    localAddr,
    localPort,
    socks5Password,
    socks5Username,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    ...connectConfig
  } = config;

  return connectConfig;
}

function getSshTunnelConfig(config: Partial<SshTunnelConfig>): SshTunnelConfig {
  return {
    localAddr: '127.0.0.1',
    localPort: 0,
    socks5Username: undefined,
    socks5Password: undefined,
    ...config,
  };
}

export class SshTunnel extends EventEmitter {
  private connections: Set<Socket> = new Set();
  private server: any;
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
    this.server = socks5Server.createServer(
      async (
        info: any,
        accept: (intercept: true) => Socket,
        deny: () => void
      ) => {
        debug('receiving socks5 forwarding request', info);
        let socket: Socket | null = null;

        try {
          const channel = await this.forwardOut(
            info.srcAddr,
            info.srcPort,
            info.dstAddr,
            info.dstPort
          );
          debug('channel opened, accepting socks5 request', info);

          socket = accept(true);
          this.connections.add(socket);

          socket.on('error', (err: ErrorWithOrigin) => {
            debug('error on socksv5 socket', info, err);
            err.origin = err.origin ?? 'connection';
            this.server.emit('error', err);
          });

          socket.once('close', () => {
            debug('socksv5 socket closed, removing from set');
            this.connections.delete(socket as Socket);
          });

          socket.pipe(channel).pipe(socket);
        } catch (err) {
          debug('caught error, rejecting socks5 request', info, err);
          deny();
          if (socket) {
            (err as any).origin = 'ssh-client';
            socket.destroy(err as any);
          }
        }
      }
    );

    if (!this.rawConfig.socks5Username) {
      debug('skipping auth setup for this server');
      this.server.useAuth(socks5AuthNone());
    } else {
      this.server.useAuth(
        socks5AuthUserPassword(
          (user: string, pass: string, cb: (success: boolean) => void) => {
            const success =
              this.rawConfig.socks5Username === user &&
              this.rawConfig.socks5Password === pass;
            debug('validating auth parameters', success);
            process.nextTick(cb, success);
          }
        )
      );
    }

    this.serverListen = promisify(this.server.listen.bind(this.server));
    this.serverClose = promisify(this.server.close.bind(this.server));

    for (const eventName of ['close', 'error', 'listening'] as const) {
      this.server.on(eventName, this.emit.bind(this, eventName));
    }
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

    debug('starting to listen', { localAddr, localPort });
    await this.serverListen(localPort, localAddr);

    try {
      debug('creating SSH connection');
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
      debug('created SSH connection');
    } catch (err) {
      debug('failed to establish SSH connection', err);
      await this.serverClose();
      throw err;
    }
  }

  async close(): Promise<void> {
    debug('closing SSH tunnel');
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
