import { ipVersion } from 'is-ip';
import { Duplex } from 'stream';
import { getMultiplexLink } from '../../src/multiplex-link';

type ConnectOptions = {
  host: string;
  port: number;
  tls?: boolean;
};

/**
 * net.Socket polyfill that works over WebSocket connections.
 *
 * Supports two modes:
 * 1. Multiplexed link: Uses a shared WebSocket with BSON framing
 * 2. Direct WebSocket proxy: Direct connection to local proxy server
 */
class Socket extends Duplex {
  private _localPort = 0;
  private _remoteHost = '';
  private _remotePort = 0;

  constructor() {
    super();
  }

  connect(options: ConnectOptions) {
    const link = getMultiplexLink();
    if (!link) {
      throw new Error('Link is not available');
    }
    // Multiplex path: tunnel this logical connection over the single shared
    // WebSocket, using BSON 5-tuple framing.
    this._remoteHost = options.host;
    this._remotePort = options.port;
    this._localPort = link.allocatePort();

    link
      .registerSocket(this._localPort, {
        onData: (data: Uint8Array) => {
          queueMicrotask(() => {
            this.push(Buffer.from(data));
          });
        },
        onClose: () => {
          this._teardown();
          queueMicrotask(() => this.emit('close'));
        },
        onError: (err: Error) => {
          this._teardown();
          queueMicrotask(() => this.emit('error', err));
        },
      })
      .then(() => {
        // The websocket is connected already and we will emit the connect
        // event so that driver sends the first message to the server.
        queueMicrotask(() => {
          this.emit(options.tls ? 'secureConnect' : 'connect');
        });
      })
      .catch((err) => {
        queueMicrotask(() =>
          this.emit(
            'error',
            err instanceof Error ? err : new Error(String(err))
          )
        );
      });
    return this;
  }
  _read() {
    // noop
  }
  _write(chunk: Buffer, _encoding: BufferEncoding, cb: () => void) {
    const link = getMultiplexLink();
    if (link && this._localPort !== 0) {
      link.sendData(
        this._localPort,
        this._remoteHost,
        this._remotePort,
        new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
      );
    }
    queueMicrotask(() => {
      cb();
    });
  }
  private _teardown(errorMessage?: string): void {
    if (this._localPort === 0) return;
    const link = getMultiplexLink();
    if (errorMessage && link) {
      link.sendError(
        this._localPort,
        this._remoteHost,
        this._remotePort,
        errorMessage
      );
    }
    link?.unregisterSocket(this._localPort);
    this._localPort = 0;
  }
  destroy() {
    if (this._localPort !== 0) {
      this._teardown('Stream destroyed by client');
    }
    return this;
  }
  end(fn?: () => void) {
    if (this._localPort !== 0) {
      this._teardown('Stream ended by client');
      queueMicrotask(() => {
        fn?.();
      });
      return this;
    }
    return this;
  }
  setKeepAlive() {
    return this;
  }
  setTimeout() {
    return this;
  }
  setNoDelay() {
    return this;
  }
}

export { isIPv4, isIPv6 } from 'is-ip';
export const isIP = (input: string) => ipVersion(input) ?? 0;
export const createConnection = (options: { host: string; port: number }) => {
  const socket = new Socket();
  queueMicrotask(() => {
    socket.connect(options);
  });
  return socket;
};
