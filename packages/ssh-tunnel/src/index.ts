import { promisify } from 'util';
import { EventEmitter, once } from 'events';
import type { Socket } from 'net';
import type { ClientChannel, ConnectConfig } from 'ssh2';
import { Client as SshClient } from 'ssh2';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

// The socksv5 module is not bundle-able by itself, so we get the
// subpackages directly
import socks5Server from 'socksv5/lib/server';
import socks5AuthNone from 'socksv5/lib/auth/None';
import socks5AuthUserPassword from 'socksv5/lib/auth/UserPassword';

const { log, mongoLogId, debug } =
  createLoggerAndTelemetry('COMPASS-SSH-TUNNEL');

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

let idCounter = 0;
export class SshTunnel extends EventEmitter {
  private connected = false;
  private closed = false;
  private connectingPromise?: Promise<void>;
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
  private logCtx = `tunnel-${idCounter++}`;

  constructor(config: Partial<SshTunnelConfig> = {}) {
    super();

    this.rawConfig = getSshTunnelConfig(config);

    this.sshClient = new SshClient();

    this.sshClient.on('close', () => {
      log.info(mongoLogId(1_001_000_252), this.logCtx, 'sshClient closed');
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
            log.info(
              mongoLogId(1_001_000_253),
              this.logCtx,
              'Validated auth parameters',
              { success }
            );
            queueMicrotask(() => cb(success));
          }
        )
      );
    } else {
      log.info(mongoLogId(1_001_000_254), this.logCtx, 'Skipping auth setup');
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

    log.info(
      mongoLogId(1_001_000_255),
      this.logCtx,
      'Listening for Socks5 connections',
      { localAddr, localPort }
    );
    await this.serverListen(localPort, localAddr);

    await this.connectSsh();
  }

  async close(): Promise<void> {
    log.info(mongoLogId(1_001_000_256), this.logCtx, 'Closing SSH tunnel');
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

    log.info(
      mongoLogId(1_001_000_257),
      this.logCtx,
      'Establishing new SSH connection'
    );

    this.connectingPromise = Promise.race([
      once(this.sshClient, 'error').then(([err]) => {
        throw err;
      }),
      (() => {
        const waitForReady = once(this.sshClient, 'ready').then(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function
        this.sshClient.connect(getConnectConfig(this.rawConfig));
        return waitForReady;
      })(),
    ]);

    try {
      await this.connectingPromise;
    } catch (err) {
      this.emit('forwardingError', err);
      log.error(
        mongoLogId(1_001_000_258),
        this.logCtx,
        'Failed to establish new SSH connection',
        { error: (err as any)?.stack ?? String(err) }
      );
      delete this.connectingPromise;
      await this.serverClose();
      throw err;
    }

    delete this.connectingPromise;
    this.connected = true;
    log.info(
      mongoLogId(1_001_000_259),
      this.logCtx,
      'Finished establishing new SSH connection'
    );
  }

  private async closeSshClient() {
    if (!this.connected) {
      return;
    }

    // don't automatically reconnect if another request comes in
    this.closed = true;

    const promise = once(this.sshClient, 'close');
    this.sshClient.end();
    return promise;
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
    const { srcAddr, srcPort, dstAddr, dstPort } = info;
    const logMetadata = { srcAddr, srcPort, dstAddr, dstPort };
    log.info(
      mongoLogId(1_001_000_260),
      this.logCtx,
      'Received Socks5 fowarding request',
      {
        ...logMetadata,
      }
    );
    let socket: Socket | null = null;

    try {
      await this.connectSsh();

      let channel;
      try {
        channel = await this.forwardOut(srcAddr, srcPort, dstAddr, dstPort);
      } catch (err) {
        if ((err as Error).message === 'Not connected') {
          this.connected = false;
          log.error(
            mongoLogId(1_001_000_261),
            this.logCtx,
            'Error forwarding Socks5 request, retrying',
            {
              ...logMetadata,
              error: (err as Error).stack,
            }
          );
          await this.connectSsh();
          channel = await this.forwardOut(srcAddr, srcPort, dstAddr, dstPort);
        } else {
          throw err;
        }
      }

      log.info(
        mongoLogId(1_001_000_262),
        this.logCtx,
        'Opened SSH channel and accepting socks5 request',
        {
          ...logMetadata,
        }
      );

      socket = accept(true);
      this.connections.add(socket);

      socket.on('error', (err: ErrorWithOrigin) => {
        log.error(
          mongoLogId(1_001_000_263),
          this.logCtx,
          'Error on Socks5 stream socket',
          {
            ...logMetadata,
            error: (err as Error).stack,
          }
        );
        err.origin = err.origin ?? 'connection';
        this.emit('forwardingError', err);
      });

      socket.once('close', () => {
        log.info(
          mongoLogId(1_001_000_264),
          this.logCtx,
          'Socks5 stream socket closed',
          {
            ...logMetadata,
          }
        );
        this.connections.delete(socket as Socket);
      });

      socket.pipe(channel).pipe(socket);
    } catch (err) {
      this.emit('forwardingError', err);
      log.error(
        mongoLogId(1_001_000_265),
        this.logCtx,
        'Error establishing SSH channel for Socks5 request',
        {
          ...logMetadata,
          error: (err as Error).stack,
        }
      );
      deny();
      if (socket) {
        (err as any).origin = 'ssh-client';
        socket.destroy(err as any);
      }
    }
  }
}

export default SshTunnel;
