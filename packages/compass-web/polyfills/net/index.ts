import { ipVersion } from 'is-ip';
import type { ConnectionOptions } from 'mongodb-data-service';
import { Duplex } from 'stream';
import { getMultiplexLink } from '../../src/multiplex-link';

type ConnectOptions = Pick<ConnectionOptions, 'lookup'> & {
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
const MESSAGE_TYPE = {
  JSON: 0x01,
  BINARY: 0x02,
} as const;

class Socket extends Duplex {
  private _ws: WebSocket | null = null;

  // Multiplex link state
  private _localPort = 0;
  private _remoteHost = '';
  private _remotePort = 0;

  constructor() {
    super();
  }

  private setupMultiplexedConnection(options: Omit<ConnectOptions, 'lookup'>) {
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

  connect({ lookup, ...options }: ConnectOptions): Socket {
    if (getMultiplexLink()) {
      return this.setupMultiplexedConnection(options);
    }

    const { wsURL, ...atlasOptions } =
      lookup?.() ?? ({} as { wsURL?: string; clusterName?: string });
    this._ws = new WebSocket(wsURL ?? 'http://localhost:1337');
    this._ws.binaryType = 'arraybuffer';
    this._ws.addEventListener(
      'open',
      () => {
        const connectMsg = JSON.stringify({
          port: options.port,
          host: options.host,
          tls: options.tls ?? false,
          clusterName: atlasOptions.clusterName,
          ok: 1,
        });
        setTimeout(() => {
          this._ws?.send(this.encodeStringMessageWithTypeByte(connectMsg));
        });
      },
      { once: true }
    );
    this._ws.addEventListener('close', () => {
      this.emit('close');
    });
    this._ws.addEventListener('error', () => {
      this.emit('error', 'WebSocket connection was closed due to an error');
    });
    this._ws.addEventListener(
      'message',
      ({ data }: MessageEvent<ArrayBuffer>) => {
        const dataView = new Uint8Array(data);
        if (dataView[0] === 0x01) {
          try {
            const res = this.decodeMessageWithTypeByte(dataView);
            if (res.preMessageOk) {
              setTimeout(() => {
                this.emit(options.tls ? 'secureConnect' : 'connect');
              });
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('error parsing proxy message "%s":', data, err);
          }
        } else {
          setTimeout(() => {
            this.emit('data', this.decodeMessageWithTypeByte(dataView));
          });
        }
      }
    );
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
    } else {
      this._ws?.send(
        this.encodeBinaryMessageWithTypeByte(new Uint8Array(chunk))
      );
    }
    setTimeout(() => {
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
    } else {
      this._ws?.close();
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
    if (this._ws?.readyState === this._ws?.CLOSED) {
      setTimeout(() => {
        fn?.();
      });
      return this;
    }
    this._ws?.addEventListener(
      'close',
      () => {
        fn?.();
      },
      { once: true }
    );
    this._ws?.close();
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

  encodeStringMessageWithTypeByte(message: string) {
    const utf8Encoder = new TextEncoder();
    const utf8Array = utf8Encoder.encode(message);
    return this.encodeMessageWithTypeByte(utf8Array, MESSAGE_TYPE.JSON);
  }

  encodeBinaryMessageWithTypeByte(message: Uint8Array) {
    return this.encodeMessageWithTypeByte(message, MESSAGE_TYPE.BINARY);
  }

  encodeMessageWithTypeByte(
    message: Uint8Array,
    type: (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE]
  ) {
    const encoded = new Uint8Array(message.length + 1);
    encoded[0] = type;
    encoded.set(message, 1);
    return encoded;
  }

  decodeMessageWithTypeByte(message: Uint8Array) {
    const typeByte = message[0];
    if (typeByte === Number(MESSAGE_TYPE.JSON)) {
      const jsonBytes = message.subarray(1);
      const textDecoder = new TextDecoder('utf-8');
      const jsonStr = textDecoder.decode(jsonBytes);
      return JSON.parse(jsonStr);
    } else if (typeByte === Number(MESSAGE_TYPE.BINARY)) {
      return message.subarray(1);
    } else {
      // eslint-disable-next-line no-console
      console.error('message does not have valid type byte "%s"', message);
    }
  }
}

export { isIPv4, isIPv6 } from 'is-ip';
export const isIP = (input: string) => ipVersion(input) ?? 0;
export const createConnection = (options: { host: string; port: number }) => {
  const socket = new Socket();
  setTimeout(() => {
    socket.connect(options);
  });
  return socket;
};
