/**
 * MultiplexWebSocketTransport — single shared WebSocket per browser tab
 * that multiplexes all MongoDB driver connections using BSON 5-tuple framing.
 *
 * Protocol frame layout (each WebSocket binary message):
 *   [BSON document: Header][raw payload bytes]
 *
 * Header fields:
 *   v  – version (1 for normal frames, -1 for error/close signal)
 *   sa – source address   (client-side: "localhost")
 *   sp – source port      (client-side: locally allocated integer)
 *   da – destination address (MongoDB hostname)
 *   dp – destination port    (MongoDB port, e.g. 27017)
 *   sz – payload size in bytes
 *   er – error message (only present when v=-1)
 *
 * Direction semantics:
 *   Client  ->  Server: sa/sp identify the logical stream; da/dp identify the MongoDB endpoint.
 *   Server  ->  Client: da/dp identify the logical stream back to the client
 *                    (da="localhost", dp = the client's sp for that stream).
 *
 * Demultiplexing on the client side: dp in a server-to-client frame equals
 * the localPort (sp) allocated when the stream was opened.
 */

import {
  serialize as bsonSerialize,
  deserialize as bsonDeserialize,
} from 'bson';

/**
 * WebSocket close codes that must NOT trigger reconnection.
 */
const NO_RETRY_CLOSE_CODES = new Set([
  1000, // Normal closure
  1002, // Protocol error
  1006, // Abnormal closure
  1008, // Policy violation
  1009, // Message too big
  3000, // Close code unauthorized
  3003, // Forbidden
  4004, // Not found
  4101, // Do not try again
]);

export type Routing = {
  sz: number;
  sa: string;
  sp: number;
  da: string;
  dp: number;
};
export type ErrorHeader = { v: -1; er: string };
export type SuccessHeader = { v: 1 };
export type Header = (SuccessHeader | ErrorHeader) & Routing;

type MultiplexWebSocketTransportOptions = {
  /** Source address to use in CONNECT frames. Defaults to "localhost". */
  sourceAddress?: string;
  /** Max number of reconnect attempts before giving up. Defaults to 5. */
  maxReconnectAttempts?: number;
  /** Base delay in ms for exponential backoff when reconnecting. Defaults to 500ms. */
  baseReconnectDelayMs?: number;
};

/** Callbacks called by the transport when events occur on a logical stream. */
export interface MultiplexSocketCallbacks {
  /** Called when payload bytes arrive from the server for this stream. */
  onData(data: Uint8Array): void;
  /** Called when the server gracefully closes this stream. */
  onClose(): void;
  /** Called when an error frame arrives or a non-retryable WS close happens. */
  onError(err: Error): void;
}

/** Parse a WebSocket binary message into a (header, payload) pair. Returns null on malformed input. */
export function parseFrame(
  data: Uint8Array
): { header: Header; payload: Uint8Array } | null {
  if (data.length < 4) return null;

  // BSON documents start with a 4-byte little-endian int32 containing the total doc size.
  const headerSize =
    data[0] | (data[1] << 8) | (data[2] << 16) | ((data[3] << 24) >>> 0);

  if (headerSize < 5 || headerSize > data.length) return null;

  try {
    const headerSlice = data.slice(0, headerSize);
    const header = bsonDeserialize(headerSlice) as Header;
    const payload = data.slice(headerSize);
    return { header, payload };
  } catch {
    return null;
  }
}

/** Encode a header + optional payload into a WebSocket binary message. */
export function buildFrame(header: Header, payload?: Uint8Array): Uint8Array {
  const headerBytes = bsonSerialize(header);
  if (!payload || payload.length === 0) {
    return headerBytes;
  }
  const frame = new Uint8Array(headerBytes.length + payload.length);
  frame.set(headerBytes, 0);
  frame.set(payload, headerBytes.length);
  return frame;
}

/**
 * Manages a single shared WebSocket connection for a browser tab and multiplexes
 * all MongoDB driver TCP connections over it using BSON 5-tuple framing.
 */
export class MultiplexWebSocketTransport {
  private ws: WebSocket | null = null;
  private readonly baseUrl: string;
  private readonly options: Required<MultiplexWebSocketTransportOptions>;
  private readonly sockets = new Map<number, MultiplexSocketCallbacks>();
  /** Monotonically increasing counter used as the logical "source port" for each stream. */
  private nextPort = 1;
  private reconnectAttempts = 0;
  private closed = false;
  private connectPromise: Promise<void> | null = null;
  private connectResolve: (() => void) | null = null;
  private connectReject: ((err: Error) => void) | null = null;

  constructor(
    baseUrl: string,
    options: MultiplexWebSocketTransportOptions = {
      sourceAddress: 'localhost',
      maxReconnectAttempts: 5,
      baseReconnectDelayMs: 500,
    }
  ) {
    this.baseUrl = baseUrl;
    this.options = {
      sourceAddress: options.sourceAddress ?? 'localhost',
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      baseReconnectDelayMs: options.baseReconnectDelayMs ?? 500,
    };
  }

  private buildWsUrl(): string {
    const url = this.baseUrl;
    if (url.startsWith('wss://') || url.startsWith('ws://')) {
      return url;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.startsWith('//')
      ? `${protocol}${url}`
      : `${protocol}//${window.location.host}${url}`;
  }

  /** Open the shared WebSocket. Returns a promise that resolves when the connection is ready. */
  async connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;
    if (this.closed) throw new Error('Transport is closed');

    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
      this.openWebSocket();
    });

    return await this.connectPromise;
  }

  private openWebSocket(): void {
    const url = this.buildWsUrl();
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;

    ws.addEventListener(
      'open',
      () => {
        this.reconnectAttempts = 0;
        this.connectResolve?.();
        this.connectResolve = null;
        this.connectReject = null;
      },
      { once: true }
    );

    ws.addEventListener(
      'close',
      (event) => {
        if (this.ws !== ws) return; // stale event from a previous socket
        this.ws = null;

        if (this.closed) return;

        const permanentClose = NO_RETRY_CLOSE_CODES.has(event.code);
        const exhaustedConnectAttempts =
          this.reconnectAttempts >= this.options.maxReconnectAttempts;
        if (!permanentClose && !exhaustedConnectAttempts) {
          this.reconnectAttempts++;
          const delay =
            this.options.baseReconnectDelayMs *
            Math.pow(2, this.reconnectAttempts - 1);
          this.connectPromise = null;
          setTimeout(() => {
            if (this.closed) return;
            this.connectPromise = new Promise<void>((resolve, reject) => {
              this.connectResolve = resolve;
              this.connectReject = reject;
              this.openWebSocket();
            });
          }, delay);
        } else {
          const err = new Error(
            `WebSocket closed: code=${event.code} reason=${event.reason}`
          );
          this.connectReject?.(err);
          this.connectResolve = null;
          this.connectReject = null;
          this.connectPromise = null;
          for (const callbacks of this.sockets.values()) {
            callbacks.onError(err);
          }
          this.sockets.clear();
        }
      },
      { once: true }
    );

    ws.addEventListener('message', ({ data }: MessageEvent<ArrayBuffer>) => {
      this.handleMessage(new Uint8Array(data));
    });
  }

  private handleMessage(data: Uint8Array): void {
    const parsed = parseFrame(data);
    if (!parsed) return;

    const { header, payload } = parsed;

    // In server -> client frames, `dp` is the client's local port (our sp).
    const localPort = header.dp;
    const callbacks = this.sockets.get(localPort);
    if (!callbacks) return;

    if (header.v === -1) {
      // Server sent an error/close signal for this stream
      callbacks.onError(new Error(`Connection closed by remote: ${header.er}`));
      this.sockets.delete(localPort);
      return;
    }

    if (payload.length > 0) {
      callbacks.onData(payload);
    }
  }

  /** Allocate a unique local port number for a new logical stream. */
  allocatePort(): number {
    return this.nextPort++;
  }

  /** Register callbacks for a logical stream identified by its local port. */
  registerSocket(localPort: number, callbacks: MultiplexSocketCallbacks): void {
    this.sockets.set(localPort, callbacks);
  }

  /** Remove callbacks for a logical stream (call after error or close). */
  unregisterSocket(localPort: number): void {
    this.sockets.delete(localPort);
  }

  /** Send a data frame for an established logical stream. */
  sendData(
    localPort: number,
    destAddr: string,
    destPort: number,
    data: Uint8Array
  ): void {
    const header: Header = {
      v: 1,
      sa: this.options.sourceAddress,
      sp: localPort,
      da: destAddr,
      dp: destPort,
      sz: data.length,
    };
    this.sendRaw(buildFrame(header, data));
  }

  /**
   * Send a v=-1 error frame to signal that this logical stream is closing
   * (either because the driver closed the connection or the cluster disconnected).
   */
  sendError(
    localPort: number,
    destAddr: string,
    destPort: number,
    errorMessage: string
  ): void {
    const header: Header = {
      v: -1,
      sa: this.options.sourceAddress,
      sp: localPort,
      da: destAddr,
      dp: destPort,
      sz: 0,
      er: errorMessage,
    };
    this.sendRaw(buildFrame(header));
  }

  private sendRaw(frame: Uint8Array): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    }
  }

  /** Close the shared WebSocket and notify all registered streams. */
  close(): void {
    this.closed = true;
    this.ws?.close(1000, 'tab closed');
    this.ws = null;
    this.connectPromise = null;
    for (const callbacks of this.sockets.values()) {
      callbacks.onClose();
    }
    this.sockets.clear();
  }
}

let _activeTransport: MultiplexWebSocketTransport | null = null;
export function setMultiplexTransport(
  transport: MultiplexWebSocketTransport | null
): void {
  _activeTransport = transport;
}
export function getMultiplexTransport(): MultiplexWebSocketTransport | null {
  return _activeTransport;
}
