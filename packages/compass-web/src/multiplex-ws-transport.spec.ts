import { expect } from 'chai';
import sinon from 'sinon';
import {
  MultiplexWebSocketTransport,
  getMultiplexTransport,
  setMultiplexTransport,
  parseFrame,
  buildFrame,
} from './multiplex-ws-transport';
import type {
  Header,
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

function serverFrame<V extends -1 | 1>(
  dp: number,
  payload = new Uint8Array(0),
  v: V = 1 as V,
  er: V extends -1 ? string : never = '' as V extends -1 ? string : never
): ArrayBuffer {
  const frame = buildFrame(
    {
      sa: 'localhost',
      sp: 0,
      da: 'localhost',
      dp,
      sz: payload.length,
      ...(v === -1 ? { er, v: -1 } : { v: 1 }),
    },
    payload.length > 0 ? payload : undefined
  );
  // buildFrame returns a Uint8Array backed by its own buffer — slice to get
  // a proper standalone ArrayBuffer regardless of any internal byteOffset.
  return frame.buffer.slice(
    frame.byteOffset,
    frame.byteOffset + frame.byteLength
  ) as ArrayBuffer;
}

function makeCallbacks(): {
  calls: Record<keyof MultiplexSocketCallbacks, unknown[][]>;
  cb: MultiplexSocketCallbacks;
} {
  const calls: Record<keyof MultiplexSocketCallbacks, unknown[][]> =
    Object.create({
      onData: [],
      onClose: [],
      onError: [],
    });
  const cb: MultiplexSocketCallbacks = {
    onData: (d) => calls.onData.push([d]),
    onClose: () => calls.onClose.push([]),
    onError: (e) => calls.onError.push([e]),
  };
  return { calls, cb };
}

/** Open a fake socket and await the transport's connect promise together. */
async function connectTransport(
  transport: MultiplexWebSocketTransport
): Promise<FakeWebSocket> {
  const connecting = transport.connect();
  const ws = FakeWebSocket.latest();
  ws.open();
  await connecting;
  return ws;
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
      const transport = new MultiplexWebSocketTransport({
        baseUrl: 'wss://test.example.com/ccs',
      });
      const connecting = transport.connect();
      expect(FakeWebSocket.instances).to.have.length(1);

      FakeWebSocket.latest().open();
      await connecting;
    });

    it('rejects if the transport was already closed', async function () {
      const transport = new MultiplexWebSocketTransport({
        baseUrl: 'wss://test.example.com/ccs',
      });
      transport.close('Test close');

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

    beforeEach(async function () {
      transport = new MultiplexWebSocketTransport({
        baseUrl: 'wss://test.example.com/ccs',
      });
      ws = await connectTransport(transport);
    });

    it('fires onData with the payload bytes', async function () {
      const { calls, cb } = makeCallbacks();
      const port = transport.allocatePort();
      await transport.registerSocket(port, cb);

      const payload = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      ws.receiveMessage(serverFrame(port, payload));

      expect(calls.onData).to.have.length(1);
      expect(calls.onData[0][0]).to.deep.equal(payload);
    });

    it('fires onError and unregisters the socket for a v=-1 error frame', async function () {
      const { calls, cb } = makeCallbacks();
      const port = transport.allocatePort();
      await transport.registerSocket(port, cb);

      ws.receiveMessage(serverFrame(port, new Uint8Array(0), -1, 'Test error'));

      expect(calls.onError).to.have.length(1);
      // Socket is unregistered — subsequent messages for it are silently dropped
      ws.receiveMessage(serverFrame(port, new Uint8Array([1])));
      expect(calls.onData).to.have.length(0);
    });

    it('routes frames to the correct socket by local port', async function () {
      const { calls: c1, cb: cb1 } = makeCallbacks();
      const { calls: c2, cb: cb2 } = makeCallbacks();
      const port1 = transport.allocatePort();
      const port2 = transport.allocatePort();
      await transport.registerSocket(port1, cb1);
      await transport.registerSocket(port2, cb2);

      ws.receiveMessage(serverFrame(port2, new Uint8Array([0x01])));

      expect(c1.onData).to.have.length(0);
      expect(c2.onData).to.have.length(1);
    });

    it('silently ignores frames for unknown ports', async function () {
      const { calls, cb } = makeCallbacks();
      await transport.registerSocket(99, cb);

      ws.receiveMessage(serverFrame(42, new Uint8Array([1])));

      expect(calls.onData).to.have.length(0);
      expect(calls.onError).to.have.length(0);
    });

    it('silently ignores malformed frames', async function () {
      const { calls, cb } = makeCallbacks();
      await transport.registerSocket(1, cb);

      // Too short to be a valid BSON document
      ws.receiveMessage(new Uint8Array([0x01, 0x02]).buffer);

      expect(calls.onData).to.have.length(0);
      expect(calls.onError).to.have.length(0);
    });
  });

  describe('#sendData()', function () {
    it('sends a frame whose payload matches the provided data', async function () {
      const transport = new MultiplexWebSocketTransport({
        baseUrl: 'wss://test.example.com/ccs',
      });
      const ws = await connectTransport(transport);

      const data = new Uint8Array([0xca, 0xfe]);
      transport.sendData(1, 'db.example.com', 27017, data);

      const result = parseFrame(ws.sent[0]);
      expect(result).to.not.be.null;
      expect(result!.header.v).to.equal(1);
      expect(result!.payload).to.deep.equal(data);
    });
  });

  describe('#sendError()', function () {
    it('sends a frame with v=-1', async function () {
      const transport = new MultiplexWebSocketTransport({
        baseUrl: 'wss://test.example.com/ccs',
      });
      const ws = await connectTransport(transport);

      transport.sendError(1, 'db.example.com', 27017, 'Test error');

      const result = parseFrame(ws.sent[0]);
      expect(result).to.not.be.null;
      expect(result!.header.v).to.equal(-1);
      expect(result!.header).to.have.property('er', 'Test error');
    });
  });

  describe('#close()', function () {
    it('calls onClose on every registered socket', async function () {
      const transport = new MultiplexWebSocketTransport({
        baseUrl: 'wss://test.example.com/ccs',
      });
      await connectTransport(transport);

      const { calls: c1, cb: cb1 } = makeCallbacks();
      const { calls: c2, cb: cb2 } = makeCallbacks();
      await transport.registerSocket(1, cb1);
      await transport.registerSocket(2, cb2);

      transport.close('Test close');

      expect(c1.onClose).to.have.length(1);
      expect(c2.onClose).to.have.length(1);
    });
  });

  describe('module-level singleton transport instance', function () {
    it('getMultiplexTransport returns null by default', function () {
      expect(getMultiplexTransport()).to.be.null;
    });

    it('setMultiplexTransport / getMultiplexTransport', function () {
      const transport = new MultiplexWebSocketTransport({
        baseUrl: 'wss://test.example.com/ccs',
      });
      setMultiplexTransport(transport);
      expect(getMultiplexTransport()).to.equal(transport);
      setMultiplexTransport(null);
      expect(getMultiplexTransport()).to.be.null;
    });
  });

  describe('parseFrame / buildFrame', function () {
    const baseHeader: Header = {
      v: 1,
      sa: 'localhost',
      sp: 42,
      da: 'db.example.com',
      dp: 27017,
      sz: 0,
    };

    describe('buildFrame', function () {
      it('returns a Uint8Array whose first 4 bytes encode the BSON document size', function () {
        const frame = buildFrame(baseHeader);
        const size =
          frame[0] |
          (frame[1] << 8) |
          (frame[2] << 16) |
          ((frame[3] << 24) >>> 0);
        expect(size).to.equal(frame.length);
      });

      it('concatenates header bytes followed by payload bytes', function () {
        const payload = new Uint8Array([0xca, 0xfe, 0xba, 0xbe]);
        const frame = buildFrame(baseHeader, payload);

        // The first part must be parseable as a BSON doc
        const headerSize =
          frame[0] |
          (frame[1] << 8) |
          (frame[2] << 16) |
          ((frame[3] << 24) >>> 0);

        expect(frame.length).to.equal(headerSize + payload.length);
        expect(frame.slice(headerSize)).to.deep.equal(payload);
      });

      it('returns only header bytes when no payload is provided', function () {
        const withoutPayload = buildFrame(baseHeader);
        const withEmptyPayload = buildFrame(baseHeader, new Uint8Array(0));
        expect(withoutPayload).to.deep.equal(withEmptyPayload);
      });
    });

    describe('parseFrame', function () {
      it('returns null for data shorter than 4 bytes', function () {
        expect(parseFrame(new Uint8Array([0x01, 0x02]))).to.be.null;
      });

      it('returns null when headerSize exceeds data length', function () {
        // Craft 5 bytes where the first 4 encode a size of 100
        const bad = new Uint8Array([100, 0, 0, 0, 0]);
        expect(parseFrame(bad)).to.be.null;
      });

      it('returns the header and an empty payload for a header-only frame', function () {
        const frame = buildFrame(baseHeader);
        const result = parseFrame(frame);

        expect(result).to.not.be.null;
        expect(result!.header.v).to.equal(1);
        expect(result!.header.sa).to.equal('localhost');
        expect(result!.header.sp).to.equal(42);
        expect(result!.header.da).to.equal('db.example.com');
        expect(result!.header.dp).to.equal(27017);
        expect(result!.payload.length).to.equal(0);
      });

      it('round-trips buildFrame → parseFrame preserving header and payload', function () {
        const payload = new Uint8Array([1, 2, 3, 4, 5]);
        const frame = buildFrame(
          { ...baseHeader, sz: payload.length },
          payload
        );
        const result = parseFrame(frame);

        expect(result).to.not.be.null;
        expect(result!.header.v).to.equal(baseHeader.v);
        expect(result!.header.sp).to.equal(baseHeader.sp);
        expect(result!.header.dp).to.equal(baseHeader.dp);
        expect(result!.payload).to.deep.equal(payload);
      });
    });
  });
});
