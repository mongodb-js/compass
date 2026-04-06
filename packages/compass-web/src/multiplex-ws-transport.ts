/**
 * MultiplexWebSocketTransport — single shared WebSocket per browser tab
 * that multiplexes all MongoDB driver connections using BSON 5-tuple framing.
 *
 * Protocol frame layout (each WebSocket binary message):
 *   [BSON document: FrameHeader][raw payload bytes]
 *
 * FrameHeader fields:
 *   v  – version (1 for normal frames, -1 for error/close signal)
 *   sa – source address   (client-side: "localhost")
 *   sp – source port      (client-side: locally allocated integer)
 *   da – destination address (MongoDB hostname)
 *   dp – destination port    (MongoDB port, e.g. 27017)
 *   sz – payload size in bytes
 *
 * Direction semantics:
 *   Client → Server: sa/sp identify the logical stream; da/dp identify the MongoDB endpoint.
 *   Server → Client: da/dp identify the logical stream back to the client
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
 * 1000 = normal closure (intentional), anything in this set is permanent.
 */
const NO_RETRY_CLOSE_CODES = new Set([
  1000, // Normal closure
  1002, // Protocol error
  1003, // Unsupported data
  1007, // Invalid payload data
  1008, // Policy violation
  1009, // Message too big
  1011, // Internal error (fatal server-side error)
  1015, // TLS handshake failure
  4000, // Application-specific do-not-retry codes
  4001,
  4002,
  4003,
  4004,
]);
export interface FrameHeader {
  v: number;
  sa: string;
  sp: number;
  da: string;
  dp: number;
  sz: number;
}

type MultiplexWebSocketTransportOptions = {
  /** Protocol version to use. Defaults to 1. */
  protocolVersion?: number;
  /** Source address to use in CONNECT frames. Defaults to "localhost". */
  sourceAddress?: string;
  /** Max number of reconnect attempts before giving up. Defaults to 5. */
  maxReconnectAttempts?: number;
  /** Base delay in ms for exponential backoff when reconnecting. Defaults to 500ms. */
  baseReconnectDelayMs?: number;
};

/** Callbacks called by the transport when events occur on a logical stream. */
export interface MultiplexSocketCallbacks {
  /** Called when the server acknowledges the logical stream is established. */
  onConnect(): void;
  /** Called when payload bytes arrive from the server for this stream. */
  onData(data: Uint8Array): void;
  /** Called when the server gracefully closes this stream. */
  onClose(): void;
  /** Called when an error frame arrives or a non-retryable WS close happens. */
  onError(err: Error): void;
}

function toAbsoluteWsUrl(url: string): string {
  if (url.startsWith('/') || url.startsWith('//')) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.startsWith('//')
      ? `${protocol}${url}`
      : `${protocol}//${window.location.host}${url}`;
  }
  return url;
}

/** Parse a WebSocket binary message into a (header, payload) pair. Returns null on malformed input. */
function parseFrame(
  data: Uint8Array
): { header: FrameHeader; payload: Uint8Array } | null {
  if (data.length < 4) return null;

  // BSON documents start with a 4-byte little-endian int32 containing the total doc size.
  const headerSize =
    data[0] | (data[1] << 8) | (data[2] << 16) | ((data[3] << 24) >>> 0);

  if (headerSize < 5 || headerSize > data.length) return null;

  try {
    const headerSlice = data.slice(0, headerSize);
    const header = bsonDeserialize(headerSlice) as FrameHeader;
    const payload = data.slice(headerSize);
    return { header, payload };
  } catch {
    return null;
  }
}

/** Encode a header + optional payload into a WebSocket binary message. */
function buildFrame(header: FrameHeader, payload?: Uint8Array): Uint8Array {
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
  /**
   * Frames buffered while the WebSocket is reconnecting — flushed when
   * the new connection opens.
   */
  private pendingFrames: Uint8Array[] = [];
  private connectPromise: Promise<void> | null = null;
  private connectResolve: (() => void) | null = null;
  private connectReject: ((err: Error) => void) | null = null;

  constructor(
    baseUrl: string,
    options: MultiplexWebSocketTransportOptions = {
      sourceAddress: 'localhost',
      maxReconnectAttempts: 5,
      baseReconnectDelayMs: 500,
      protocolVersion: 1,
    }
  ) {
    this.baseUrl = baseUrl;
    this.options = {
      protocolVersion: options.protocolVersion ?? 1,
      sourceAddress: options.sourceAddress ?? 'localhost',
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      baseReconnectDelayMs: options.baseReconnectDelayMs ?? 500,
    };
  }

  private buildWsUrl(): string {
    return toAbsoluteWsUrl(this.baseUrl);
  }

  /** Open the shared WebSocket. Returns a promise that resolves when the connection is ready. */
  connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;
    if (this.closed) return Promise.reject(new Error('Transport is closed'));

    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
      this.openWebSocket();
    });

    return this.connectPromise;
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
        // Flush frames buffered during a reconnect window
        for (const frame of this.pendingFrames) {
          ws.send(frame);
        }
        this.pendingFrames = [];
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
            `WebSocket closed: code=${event.code} reason=${
              event.reason || '(none)'
            }`
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

    // In server→client frames, `dp` is the client's local port (our sp).
    const localPort = header.dp;
    const callbacks = this.sockets.get(localPort);
    if (!callbacks) return;

    if (header.v === -1) {
      // Server sent an error/close signal for this stream
      callbacks.onError(new Error('Connection closed by remote'));
      this.sockets.delete(localPort);
      return;
    }

    if (header.sz === 0 && payload.length === 0) {
      // Zero-payload acknowledgment: the logical stream is established
      callbacks.onConnect();
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

  /**
   * Send the initial CONNECT frame for a new logical stream.
   * An optional metadata payload (BSON-encoded) can carry routing info
   * (e.g. projectId, clusterName) for the CCS service.
   */
  connectStream(
    localPort: number,
    destAddr: string,
    destPort: number,
    meta?: Record<string, unknown>
  ): void {
    const metaPayload =
      meta && Object.keys(meta).length > 0 ? bsonSerialize(meta) : undefined;

    const header: FrameHeader = {
      v: this.options.protocolVersion,
      sa: this.options.sourceAddress,
      sp: localPort,
      da: destAddr,
      dp: destPort,
      sz: metaPayload?.length ?? 0,
    };
    this.sendRaw(buildFrame(header, metaPayload));
  }

  /** Send a data frame for an established logical stream. */
  sendData(
    localPort: number,
    destAddr: string,
    destPort: number,
    data: Uint8Array
  ): void {
    const header: FrameHeader = {
      v: this.options.protocolVersion,
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
  sendError(localPort: number, destAddr: string, destPort: number): void {
    const header: FrameHeader = {
      v: -1,
      sa: this.options.sourceAddress,
      sp: localPort,
      da: destAddr,
      dp: destPort,
      sz: 0,
    };
    this.sendRaw(buildFrame(header));
  }

  private sendRaw(frame: Uint8Array): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    } else {
      // Buffer until the WebSocket (re)connects
      this.pendingFrames.push(frame);
    }
  }

  /** Close the shared WebSocket and notify all registered streams. */
  close(): void {
    this.closed = true;
    this.pendingFrames = [];
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
