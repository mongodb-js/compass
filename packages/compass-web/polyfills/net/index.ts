import { ipVersion } from 'is-ip';
import type { ConnectionOptions } from 'mongodb-data-service';
import { Duplex } from 'stream';

/**
 * net.Socket interface that works over the WebSocket connection. For now, only
 * used when running compass-web in a local sandbox, mms has their own
 * implementation
 */
enum MESSAGE_TYPE {
  JSON = 0x01,
  BINARY = 0x02,
}

class Socket extends Duplex {
  private _ws: WebSocket | null = null;
  constructor() {
    super();
  }
  connect({
    lookup,
    ...options
  }: {
    host: string;
    port: number;
    lookup?: ConnectionOptions['lookup'];
    tls?: boolean;
  }) {
    const { wsURL, ...atlasOptions } =
      lookup?.() ?? ({} as { wsURL?: string; clusterName?: string });
    this._ws = new WebSocket(wsURL ?? '/ws-proxy');
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
  _write(chunk: ArrayBufferLike, _encoding: BufferEncoding, cb: () => void) {
    this._ws?.send(this.encodeBinaryMessageWithTypeByte(new Uint8Array(chunk)));
    setTimeout(() => {
      cb();
    });
  }
  destroy() {
    this._ws?.close();
    return this;
  }
  end(fn?: () => void) {
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

  encodeMessageWithTypeByte(message: Uint8Array, type: MESSAGE_TYPE) {
    const encoded = new Uint8Array(message.length + 1);
    encoded[0] = type;
    encoded.set(message, 1);
    return encoded;
  }

  decodeMessageWithTypeByte(message: Uint8Array) {
    const typeByte = message[0];
    if (typeByte === MESSAGE_TYPE.JSON) {
      const jsonBytes = message.subarray(1);
      const textDecoder = new TextDecoder('utf-8');
      const jsonStr = textDecoder.decode(jsonBytes);
      return JSON.parse(jsonStr);
    } else if (typeByte === MESSAGE_TYPE.BINARY) {
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
