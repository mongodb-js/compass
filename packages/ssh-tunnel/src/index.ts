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
  private connected = false;
  private closed = false;
  private connectingPromise?: Promise<void>
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

    this.sshClient.on('close', () => {
      debug('sshClient closed');
      this.connected = false;
    });

    this.forwardOut = promisify(this.sshClient.forwardOut.bind(this.sshClient));

    this.server = socks5Server.createServer(this.socks5Request.bind(this));

    if (this.rawConfig.socks5Username) {
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
    else {
      debug('skipping auth setup for this server');
      this.server.useAuth(socks5AuthNone());
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

    await this.connectSsh(true);
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

  private async connectSsh(): Promise<void> {
    if (this.connected) {
      debug('already connected');
      return;
    }

    if (this.connectingPromise) {
      debug('reusing connectingPromise');
      return this.connectingPromise;
    }

    if (this.closed) {
      // A socks5 request could come in after we deliberately closed the connection. Don't reconnect in that case.
      throw new Error('Disconnected.');
    }

    debug('creating SSH connection');
    const ac = new AbortController();

    this.connectingPromise = Promise.race([
      once(this.sshClient, 'error', { signal: ac.signal }).then(([err]) => {
        throw err;
      }),
      (() => {
        const waitForReady = once(this.sshClient, 'ready', { signal: ac.signal }).then(() => { return; });
        this.sshClient.connect(getConnectConfig(this.rawConfig));
        return waitForReady;
      })(),
    ]);

    try {
      await this.connectingPromise;
    } catch (err) {
      ac.abort(); // stop listening for 'ready'
      debug('failed to establish SSH connection', err);
      await this.serverClose();
      throw err;
    }

    delete this.connectingPromise;
    this.connected = true;
    ac.abort(); // stop listening for 'error'
    debug('created SSH connection');
  }

  private async closeSshClient() {
    this.closed = true;
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

  private async socks5Request(
    info: any,
    accept: (intercept: true) => Socket,
    deny: () => void
  ): Promise<void> {
    debug('receiving socks5 forwarding request', info);
    let socket: Socket | null = null;

    try {
      await this.connectSsh();

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
}

export default SshTunnel;
