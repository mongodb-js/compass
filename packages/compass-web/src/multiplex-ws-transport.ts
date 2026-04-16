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
import { type Logger } from '@mongodb-js/compass-logging/provider';

/**
 * Minimum valid BSON document size: 4 bytes for length + 1 byte for terminator.
 */
const MIN_BSON_DOCUMENT_SIZE = 5;

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
  /** Base URL for the WebSocket server, e.g. "ws://localhost:1337". */
  baseUrl?: string;
  /** Source address to use in CONNECT frames. Defaults to "localhost". */
  sourceAddress?: string;
  /** Logger to use for debugging. */
  logger?: Logger;
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

  if (headerSize < MIN_BSON_DOCUMENT_SIZE || headerSize > data.length)
    return null;

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
    // bsonSerialize returns a Buffer (Node.js) which may be a view into a
    // pooled allocation (byteOffset > 0). Wrap in a fresh Uint8Array so that
    // .buffer covers exactly this frame and nothing else.
    return new Uint8Array(headerBytes);
  }
  const frame = new Uint8Array(headerBytes.length + payload.length);
  frame.set(headerBytes, 0);
  frame.set(payload, headerBytes.length);
  return frame;
}

/** Helper to add an event listener that can be easily disposed. */
export function addEventListener<K extends keyof WebSocketEventMap>(
  eventTarget: WebSocket,
  eventType: K,
  eventListener: (event: WebSocketEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): { [Symbol.dispose](): void };
export function addEventListener<K extends keyof AbortSignalEventMap>(
  eventTarget: AbortSignal | undefined,
  eventType: K,
  eventListener: (event: AbortSignalEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): { [Symbol.dispose](): void };
export function addEventListener(
  eventTarget: EventTarget | undefined,
  eventType: string,
  eventListener: (event: Event) => void,
  options?: boolean | AddEventListenerOptions
): { [Symbol.dispose](): void } {
  eventTarget?.addEventListener(eventType, eventListener, options);
  return {
    [Symbol.dispose]() {
      eventTarget?.removeEventListener(eventType, eventListener, options);
    },
  };
}

/**
 * Manages a single shared WebSocket connection for a browser tab and multiplexes
 * all MongoDB driver TCP connections over it using BSON 5-tuple framing.
 */
export class MultiplexWebSocketTransport implements Disposable {
  private ws: WebSocket | null = null;
  private readonly baseUrl: string;
  private readonly sourceAddress: string;
  private readonly logger?: Logger;
  private readonly sockets = new Map<number, MultiplexSocketCallbacks>();
  private disposableStack: DisposableStack | null = null;
  /** Monotonically increasing counter used as the logical "source port" for each stream. */
  private nextPort = 1;
  private closed = false;
  private connectPromise: Promise<void> | null = null;
  private connectResolve: (() => void) | null = null;
  private connectReject: ((err: Error) => void) | null = null;

  constructor({
    baseUrl,
    logger,
    sourceAddress,
  }: MultiplexWebSocketTransportOptions) {
    this.baseUrl = _wsUrlOverride ?? baseUrl ?? 'ws://localhost:1337';
    this.sourceAddress = sourceAddress ?? 'localhost';
    this.logger = logger;
    this.logger?.log.info(
      this.logger?.mongoLogId(1_001_000_420),
      'COMPASS-WEB-MULTIPLEXING',
      'MultiplexWebSocketTransport created',
      {
        baseUrl: this.baseUrl,
        sourceAddress: this.sourceAddress,
      }
    );
  }

  get url(): string {
    return this.baseUrl;
  }

  /** Open the shared WebSocket. Returns a promise that resolves when the connection is ready. */
  async connect(signal?: AbortSignal): Promise<void> {
    if (this.connectPromise) return this.connectPromise;
    if (this.closed) throw new Error('Transport is closed');

    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
    });

    const dispose = addEventListener(signal, 'abort', (event) => {
      const reason: unknown = (event.target as AbortSignal).reason;
      this.connectReject?.(
        reason instanceof Error ? reason : new Error('Connection aborted.')
      );
    });

    this.openWebSocket();

    return await this.connectPromise.finally(() => dispose[Symbol.dispose]());
  }

  private openWebSocket(): void {
    const ws = new WebSocket(this.url);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;

    const disposableStack = new DisposableStack();
    disposableStack.use(
      addEventListener(ws, 'open', this.onOpen.bind(this), { once: true })
    );
    disposableStack.use(
      addEventListener(ws, 'close', this.onClose.bind(this), { once: true })
    );
    disposableStack.use(
      addEventListener(ws, 'message', this.onMessage.bind(this))
    );
    disposableStack.defer(this.close.bind(this, 'Transport Disposed'));
    this.disposableStack = disposableStack;
  }

  private onOpen() {
    this.connectResolve?.();
    this.connectResolve = null;
    this.connectReject = null;
    this.logger?.log.info(
      this.logger?.mongoLogId(1_001_000_421),
      'COMPASS-WEB-MULTIPLEXING',
      'WebSocket connection established'
    );
  }

  private onClose({ code, reason }: CloseEvent) {
    this.ws = null;
    if (this.closed) return;

    this.logger?.log.info(
      this.logger?.mongoLogId(1_001_000_422),
      'COMPASS-WEB-MULTIPLEXING',
      'WebSocket closed',
      {
        code: code,
        reason: reason,
      }
    );

    const errorMessage = [
      'Connection failed',
      (code && `[${code}]`) || null,
      (reason && `${reason}`) || null,
    ]
      .filter(Boolean)
      .join(' - ');

    const err = new Error(errorMessage);
    this.connectReject?.(err);
    this.connectResolve = null;
    this.connectReject = null;
    this.connectPromise = null;
    for (const callbacks of this.sockets.values()) {
      callbacks.onError(err);
    }
    this.sockets.clear();
  }

  private onMessage({ data }: MessageEvent<ArrayBuffer>): void {
    const parsed = parseFrame(new Uint8Array(data));
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

  /**
   * Register callbacks for a logical stream identified by its local port.
   * Note: The WebSocket connection must be open before calling this method.
   * If the connection closes immediately after registration, the onError callback
   * will be invoked by the close event handler.
   */
  async registerSocket(
    localPort: number,
    callbacks: MultiplexSocketCallbacks
  ): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
    this.logger?.log.info(
      this.logger?.mongoLogId(1_001_000_423),
      'COMPASS-WEB-MULTIPLEXING',
      'Registering socket',
      { localPort }
    );
    this.sockets.set(localPort, callbacks);
  }

  /** Remove callbacks for a logical stream (call after error or close). */
  unregisterSocket(localPort: number): void {
    this.logger?.log.info(
      this.logger?.mongoLogId(1_001_000_424),
      'COMPASS-WEB-MULTIPLEXING',
      'Unregistering socket',
      { localPort }
    );
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
      sa: this.sourceAddress,
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
      sa: this.sourceAddress,
      sp: localPort,
      da: destAddr,
      dp: destPort,
      sz: 0,
      er: errorMessage,
    };
    this.sendRaw(buildFrame(header));
  }

  private sendRaw(frame: Uint8Array): void {
    // In order to be able to send the data, we SHOULD have connected
    // to the server and ws should be in `OPEN` state.
    if (this.isConnected()) {
      this.ws?.send(frame.buffer as ArrayBuffer);
    } else {
      this.logger?.log.error(
        this.logger?.mongoLogId(1_001_000_425),
        'COMPASS-WEB-MULTIPLEXING',
        'Failed to send frame, WebSocket not open',
        { readyState: this.ws?.readyState }
      );
    }
  }

  /** Close the shared WebSocket and notify all registered streams. */
  close(reason: string): void {
    if (this.closed) return;
    this.logger?.log.info(
      this.logger?.mongoLogId(1_001_000_426),
      'COMPASS-WEB-MULTIPLEXING',
      'Closing MultiplexWebSocketTransport',
      { reason }
    );
    this.closed = true;
    this.disposableStack?.dispose();
    this.disposableStack = null;
    this.ws?.close(1000, reason);
    this.ws = null;
    this.connectPromise = null;
    this.connectResolve = null;
    this.connectReject = null;

    for (const callbacks of this.sockets.values()) {
      callbacks.onClose();
    }
    this.sockets.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  [Symbol.dispose](): void {
    this.close('Transport Disposed');
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

let _wsUrlOverride: string | null = null;
export function setWebSocketUrlOverride(url: string | null): void {
  _wsUrlOverride = url;
}
