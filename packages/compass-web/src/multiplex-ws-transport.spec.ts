import { expect } from 'chai';
import sinon from 'sinon';
import {
  serialize as bsonSerialize,
  deserialize as bsonDeserialize,
} from 'bson';
import {
  MultiplexWebSocketTransport,
  getMultiplexTransport,
  setMultiplexTransport,
} from './multiplex-ws-transport';
import type {
  FrameHeader,
  MultiplexSocketCallbacks,
} from './multiplex-ws-transport';

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;

  readyState = FakeWebSocket.CONNECTING;
  binaryType = 'blob';
  url: string;
  sent: Uint8Array[] = [];

  private _listeners = new Map<
    string,
    Array<{ fn: (e: any) => void; once: boolean }>
  >();

  static instances: FakeWebSocket[] = [];

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  addEventListener(
    type: string,
    fn: (e: any) => void,
    options?: { once?: boolean }
  ) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type)!.push({ fn, once: options?.once ?? false });
  }

  removeEventListener(type: string, fn: (e: any) => void) {
    const list = this._listeners.get(type);
    if (!list) return;
    const idx = list.findIndex((l) => l.fn === fn);
    if (idx !== -1) list.splice(idx, 1);
  }

  private _emit(type: string, event: unknown) {
    const list = [...(this._listeners.get(type) ?? [])];
    this._listeners.set(
      type,
      (this._listeners.get(type) ?? []).filter((l) => !l.once)
    );
    for (const { fn } of list) fn(event);
  }

  send(data: ArrayBuffer | Uint8Array) {
    this.sent.push(data instanceof ArrayBuffer ? new Uint8Array(data) : data);
  }

  close(code = 1000, reason = '') {
    this.readyState = FakeWebSocket.CLOSED;
    this._emit('close', { code, reason });
  }

  // --- test helpers ---
  /** Simulate the server accepting the connection. */
  open() {
    this.readyState = FakeWebSocket.OPEN;
    this._emit('open', {});
  }
  /** Simulate the server sending a binary message to the client. */
  receiveMessage(data: ArrayBuffer) {
    this._emit('message', { data });
  }
  /** Simulate the server closing the connection with a given code. */
  serverClose(code: number, reason = '') {
    this.readyState = FakeWebSocket.CLOSED;
    this._emit('close', { code, reason });
  }
  static reset() {
    FakeWebSocket.instances = [];
  }
  static latest(): FakeWebSocket {
    return FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
  }
}

/** Build a server→client binary frame (BSON header + optional payload). */
function serverFrame(
  dp: number,
  payload = new Uint8Array(0),
  v = 1
): ArrayBuffer {
  const header: FrameHeader = {
    v,
    sa: 'localhost',
    sp: 0,
    da: 'localhost',
    dp,
    sz: payload.length,
  };
  const headerBytes = bsonSerialize(header);
  const frame = new Uint8Array(headerBytes.length + payload.length);
  frame.set(headerBytes);
  frame.set(payload, headerBytes.length);
  return frame.buffer;
}

/** Parse the BSON FrameHeader out of the first bytes of a sent frame. */
function parseHeader(frame: Uint8Array): FrameHeader {
  const size =
    frame[0] | (frame[1] << 8) | (frame[2] << 16) | ((frame[3] << 24) >>> 0);
  return bsonDeserialize(frame.slice(0, size)) as FrameHeader;
}

function makeCallbacks(): {
  calls: Record<keyof MultiplexSocketCallbacks, unknown[][]>;
  cb: MultiplexSocketCallbacks;
} {
  const calls: Record<keyof MultiplexSocketCallbacks, unknown[][]> =
    Object.create({
      onConnect: [],
      onData: [],
      onClose: [],
      onError: [],
    });
  const cb: MultiplexSocketCallbacks = {
    onConnect: () => calls.onConnect.push([]),
    onData: (d) => calls.onData.push([d]),
    onClose: () => calls.onClose.push([]),
    onError: (e) => calls.onError.push([e]),
  };
  return { calls, cb };
}

describe('MultiplexWebSocketTransport', function () {
  let clock: sinon.SinonFakeTimers;
  let OriginalWebSocket: typeof WebSocket;

  beforeEach(function () {
    FakeWebSocket.reset();
    OriginalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
    clock = sinon.useFakeTimers({
      toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'],
    });
  });

  afterEach(function () {
    clock.restore();
    globalThis.WebSocket = OriginalWebSocket;
    setMultiplexTransport(null);
  });

  describe('#connect()', function () {
    it('opens a WebSocket and resolves when the connection is accepted', async function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      const connecting = transport.connect();
      expect(FakeWebSocket.instances).to.have.length(1);

      FakeWebSocket.latest().open();
      // should resolve without throwing
      await connecting;
    });

    it('returns the same promise on repeated calls', function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      const p1 = transport.connect();
      const p2 = transport.connect();
      expect(p1).to.equal(p2);
    });

    it('rejects if the transport was already closed', async function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      transport.close();

      let err: Error | undefined;
      try {
        await transport.connect();
      } catch (e) {
        err = e as Error;
      }
      expect(err?.message).to.include('Transport is closed');
    });
  });

  describe('incoming message routing', function () {
    let transport: MultiplexWebSocketTransport;
    let ws: FakeWebSocket;

    beforeEach(function () {
      transport = new MultiplexWebSocketTransport('wss://test.example.com/ccs');
      void transport.connect();
      ws = FakeWebSocket.latest();
      ws.open();
    });

    it('fires onConnect for a zero-payload ACK frame', function () {
      const { calls, cb } = makeCallbacks();
      const port = transport.allocatePort();
      transport.registerSocket(port, cb);

      ws.receiveMessage(serverFrame(port, new Uint8Array(0)));

      expect(calls.onConnect).to.have.length(1);
      expect(calls.onData).to.have.length(0);
    });

    it('fires onData with the payload bytes', function () {
      const { calls, cb } = makeCallbacks();
      const port = transport.allocatePort();
      transport.registerSocket(port, cb);

      const payload = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      ws.receiveMessage(serverFrame(port, payload));

      expect(calls.onData).to.have.length(1);
      expect(calls.onData[0][0]).to.deep.equal(payload);
    });

    it('fires onError and unregisters the socket for a v=-1 error frame', function () {
      const { calls, cb } = makeCallbacks();
      const port = transport.allocatePort();
      transport.registerSocket(port, cb);

      ws.receiveMessage(serverFrame(port, new Uint8Array(0), -1));

      expect(calls.onError).to.have.length(1);
      // Socket is unregistered — subsequent messages for it are silently dropped
      ws.receiveMessage(serverFrame(port, new Uint8Array([1])));
      expect(calls.onData).to.have.length(0);
    });

    it('routes frames to the correct socket by local port', function () {
      const { calls: c1, cb: cb1 } = makeCallbacks();
      const { calls: c2, cb: cb2 } = makeCallbacks();
      const port1 = transport.allocatePort();
      const port2 = transport.allocatePort();
      transport.registerSocket(port1, cb1);
      transport.registerSocket(port2, cb2);

      ws.receiveMessage(serverFrame(port2, new Uint8Array([0x01])));

      expect(c1.onData).to.have.length(0);
      expect(c2.onData).to.have.length(1);
    });

    it('silently ignores frames for unknown ports', function () {
      const { calls, cb } = makeCallbacks();
      transport.registerSocket(99, cb);

      ws.receiveMessage(serverFrame(42, new Uint8Array([1])));

      expect(calls.onData).to.have.length(0);
      expect(calls.onError).to.have.length(0);
    });

    it('silently ignores malformed frames', function () {
      const { calls, cb } = makeCallbacks();
      transport.registerSocket(1, cb);

      // Too short to be a valid BSON document
      ws.receiveMessage(new Uint8Array([0x01, 0x02]).buffer);

      expect(calls.onData).to.have.length(0);
      expect(calls.onError).to.have.length(0);
    });
  });

  describe('#connectStream()', function () {
    it('sends a frame with the correct 5-tuple header fields', function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      void transport.connect();
      FakeWebSocket.latest().open();

      const port = transport.allocatePort();
      transport.connectStream(port, 'db.example.com', 27017);

      const ws = FakeWebSocket.latest();
      expect(ws.sent).to.have.length(1);

      const header = parseHeader(ws.sent[0]);
      expect(header.v).to.equal(1);
      expect(header.sa).to.equal('localhost');
      expect(header.sp).to.equal(port);
      expect(header.da).to.equal('db.example.com');
      expect(header.dp).to.equal(27017);
    });
  });

  describe('#sendData()', function () {
    it('sends a frame whose payload matches the provided data', function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      void transport.connect();
      FakeWebSocket.latest().open();

      const data = new Uint8Array([0xca, 0xfe]);
      transport.sendData(1, 'db.example.com', 27017, data);

      const ws = FakeWebSocket.latest();
      const frame = ws.sent[0];
      const header = parseHeader(frame);
      const headerSize =
        frame[0] |
        (frame[1] << 8) |
        (frame[2] << 16) |
        ((frame[3] << 24) >>> 0);
      const payload = frame.slice(headerSize);

      expect(header.v).to.equal(1);
      expect(payload).to.deep.equal(data);
    });
  });

  describe('#sendError()', function () {
    it('sends a frame with v=-1', function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      void transport.connect();
      FakeWebSocket.latest().open();

      transport.sendError(1, 'db.example.com', 27017);

      const header = parseHeader(FakeWebSocket.latest().sent[0]);
      expect(header.v).to.equal(-1);
    });
  });

  describe('pending frame buffering', function () {
    it('buffers frames sent before the WebSocket opens and flushes on open', function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      void transport.connect();
      const ws = FakeWebSocket.latest();

      transport.sendError(1, 'db.example.com', 27017);
      expect(ws.sent).to.have.length(0); // still buffered

      ws.open();
      expect(ws.sent).to.have.length(1); // flushed
    });
  });

  describe('reconnect logic', function () {
    it('reconnects after a retryable close code with exponential back-off', function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      void transport.connect();
      FakeWebSocket.latest().open();

      // Code 1006 = abnormal closure, not in NO_RETRY_CLOSE_CODES
      FakeWebSocket.latest().serverClose(1006);
      expect(FakeWebSocket.instances).to.have.length(1); // no immediate reconnect

      clock.tick(501); // past first delay (500ms * 2^0)
      expect(FakeWebSocket.instances).to.have.length(2);
    });

    it('does NOT reconnect after a permanent close code (1000)', function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      void transport.connect();
      FakeWebSocket.latest().open();

      FakeWebSocket.latest().serverClose(1000);
      clock.tick(30_000);

      expect(FakeWebSocket.instances).to.have.length(1);
    });

    it('surfaces onError to all registered sockets on a permanent close', function () {
      const { calls, cb } = makeCallbacks();
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      void transport.connect();
      const ws = FakeWebSocket.latest();
      ws.open();

      transport.registerSocket(transport.allocatePort(), cb);
      ws.serverClose(1008); // policy violation — permanent

      expect(calls.onError).to.have.length(1);
    });

    it('does NOT reconnect after close() is called', function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      void transport.connect();
      FakeWebSocket.latest().open();

      transport.close();
      clock.tick(30_000);

      expect(FakeWebSocket.instances).to.have.length(1);
    });
  });

  describe('#close()', function () {
    it('calls onClose on every registered socket', function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      void transport.connect();
      FakeWebSocket.latest().open();

      const { calls: c1, cb: cb1 } = makeCallbacks();
      const { calls: c2, cb: cb2 } = makeCallbacks();
      transport.registerSocket(1, cb1);
      transport.registerSocket(2, cb2);

      transport.close();

      expect(c1.onClose).to.have.length(1);
      expect(c2.onClose).to.have.length(1);
    });
  });

  describe('module-level singleton transport instance', function () {
    it('getMultiplexTransport returns null by default', function () {
      expect(getMultiplexTransport()).to.be.null;
    });

    it('setMultiplexTransport / getMultiplexTransport', function () {
      const transport = new MultiplexWebSocketTransport(
        'wss://test.example.com/ccs'
      );
      setMultiplexTransport(transport);
      expect(getMultiplexTransport()).to.equal(transport);
      setMultiplexTransport(null);
      expect(getMultiplexTransport()).to.be.null;
    });
  });
});
