import { ipVersion } from 'is-ip';
import { Duplex } from 'stream';

const PROXY_PORT = process.env.COMPASS_WEB_WS_PROXY_PORT
  ? Number(process.env.COMPASS_WEB_WS_PROXY_PORT)
  : 1337;

/**
 * net.Socket interface that works over the WebSocket connection. For now, only
 * used when running compass-web in a local sandbox, mms has their own
 * implementation
 */
class Socket extends Duplex {
  private _ws: WebSocket | null = null;
  private _setOptions: {
    setKeepAlive?: { enabled?: boolean; initialDelay?: number };
    setTimeout?: { timeout?: number };
    setNoDelay?: { noDelay?: boolean };
  } = {};
  constructor() {
    super();
  }
  connect(options: { host: string; port: number; tls?: boolean }) {
    this._ws = new WebSocket(`ws://localhost:${PROXY_PORT}`);
    this._ws.binaryType = 'arraybuffer';
    this._ws.addEventListener(
      'open',
      () => {
        const connectMsg = JSON.stringify({
          connectOptions: options,
          setOptions: this._setOptions,
        });
        setTimeout(() => {
          this._ws?.send(connectMsg);
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
      ({ data }: MessageEvent<string | ArrayBuffer>) => {
        if (typeof data === 'string') {
          try {
            const { evt, error } = JSON.parse(data) as {
              evt: string;
              error?: Error;
            };
            setTimeout(() => {
              this.emit(
                evt,
                evt === 'error' ? Object.assign(new Error(), error) : undefined
              );
            });
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('error parsing proxy message "%s":', data, err);
          }
        } else {
          setTimeout(() => {
            this.emit('data', Buffer.from(data));
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
    this._ws?.send(chunk);
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
  setKeepAlive(enabled = false, initialDelay = 0) {
    this._setOptions.setKeepAlive = { enabled, initialDelay };
    return this;
  }
  setTimeout(timeout: number, cb?: () => void) {
    this._setOptions.setTimeout = { timeout };
    if (cb) {
      this.once('timeout', cb);
    }
    return this;
  }
  setNoDelay(noDelay = true) {
    this._setOptions.setNoDelay = { noDelay };
    return this;
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
