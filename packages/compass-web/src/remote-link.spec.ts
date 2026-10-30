import { EventEmitter, once } from 'node:events';
import { expect } from 'chai';
import type { MultiplexLink, MultiplexSocketCallbacks } from './multiplex-link';
import { RemoteLink, serveLink } from './remote-link';

type Sent = {
  sp: number;
  da: string;
  dp: number;
  data?: Uint8Array;
  er?: string;
};

/** Emits `sent` for every frame and `unregister` for every unregistration */
class FakeLink extends EventEmitter implements MultiplexLink {
  private nextPort = 100;
  readonly sockets = new Map<number, MultiplexSocketCallbacks>();
  readonly unregistered: number[] = [];
  readonly sent: Sent[] = [];
  /** Registrations wait for this, as a Link waits for its WebSocket */
  connected: Promise<void> = Promise.resolve();

  allocatePort(): number {
    return this.nextPort++;
  }
  async registerSocket(sp: number, callbacks: MultiplexSocketCallbacks) {
    await this.connected;
    this.sockets.set(sp, callbacks);
  }
  unregisterSocket(sp: number): void {
    this.unregistered.push(sp);
    this.sockets.delete(sp);
    this.emit('unregister', sp);
  }
  sendData(sp: number, da: string, dp: number, data: Uint8Array): void {
    this.sent.push({ sp, da, dp, data });
    this.emit('sent', this.sent.at(-1));
  }
  sendError(sp: number, da: string, dp: number, er: string): void {
    this.sent.push({ sp, da, dp, er });
    this.emit('sent', this.sent.at(-1));
  }
}

function socketCallbacks() {
  const data = Promise.withResolvers<Uint8Array>();
  const error = Promise.withResolvers<Error>();
  const close = Promise.withResolvers<void>();
  return {
    callbacks: {
      onData: data.resolve,
      onError: error.resolve,
      onClose: () => close.resolve(),
    },
    data: data.promise,
    error: error.promise,
    close: close.promise,
  };
}

describe('RemoteLink', function () {
  let link: FakeLink | null;
  let served: DisposableStack;

  function connectWorker(): RemoteLink {
    const { port1, port2 } = new MessageChannel();
    served.use(serveLink(port2, () => link));
    return new RemoteLink(port1);
  }

  beforeEach(function () {
    link = new FakeLink();
    served = new DisposableStack();
  });

  afterEach(function () {
    served.dispose();
  });

  it("forwards a worker socket's data to the page's link and back", async function () {
    const remote = connectWorker();
    const socket = socketCallbacks();
    const sp = remote.allocatePort();
    await remote.registerSocket(sp, socket.callbacks);

    const sent = once(link!, 'sent');
    remote.sendData(sp, 'cluster0.example.net', 27017, Buffer.from('ping'));
    expect((await sent)[0]).to.deep.include({
      sp: 100,
      da: 'cluster0.example.net',
      dp: 27017,
      data: new Uint8Array(Buffer.from('ping')),
    });

    link!.sockets.get(100)!.onData(new Uint8Array(Buffer.from('pong')));
    expect(Buffer.from(await socket.data).toString()).to.equal('pong');
  });

  it("gives each worker's sockets their own ports on the shared link", async function () {
    const first = connectWorker();
    const second = connectWorker();
    expect(first.allocatePort()).to.equal(1);
    expect(second.allocatePort()).to.equal(1);

    await first.registerSocket(1, socketCallbacks().callbacks);
    await second.registerSocket(1, socketCallbacks().callbacks);

    expect([...link!.sockets.keys()]).to.deep.equal([100, 101]);
  });

  it('rejects a socket registration when the page has no link', async function () {
    link = null;
    const remote = connectWorker();

    const error = await remote
      .registerSocket(1, socketCallbacks().callbacks)
      .catch((err: unknown) => err);

    expect(error)
      .to.be.instanceOf(Error)
      .with.property('message', 'Link is not available');
  });

  it("passes the link's stream errors and closes to the worker socket", async function () {
    const remote = connectWorker();
    const failing = socketCallbacks();
    const closing = socketCallbacks();
    await remote.registerSocket(1, failing.callbacks);
    await remote.registerSocket(2, closing.callbacks);

    link!.sockets.get(100)!.onError(new Error('Connection closed by remote'));
    link!.sockets.get(101)!.onClose();

    expect((await failing.error).message).to.equal(
      'Connection closed by remote'
    );
    await closing.close;
  });

  it("sends a worker socket's error frame through the link", async function () {
    const remote = connectWorker();
    await remote.registerSocket(1, socketCallbacks().callbacks);

    const sent = once(link!, 'sent');
    remote.sendError(1, 'cluster0.example.net', 27017, 'socket closed');

    expect((await sent)[0]).to.deep.equal({
      sp: 100,
      da: 'cluster0.example.net',
      dp: 27017,
      er: 'socket closed',
    });
  });

  it("keeps the caller's bytes when a chunk covers its whole buffer", async function () {
    const remote = connectWorker();
    await remote.registerSocket(1, socketCallbacks().callbacks);
    const chunk = new Uint8Array([1, 2, 3]);

    const sent = once(link!, 'sent');
    remote.sendData(1, 'cluster0.example.net', 27017, chunk);

    expect(chunk).to.deep.equal(new Uint8Array([1, 2, 3]));
    expect((await sent)[0].data).to.deep.equal(new Uint8Array([1, 2, 3]));
  });

  it('drops a socket the worker unregisters while the link is connecting', async function () {
    const connected = Promise.withResolvers<void>();
    link!.connected = connected.promise;
    const remote = connectWorker();
    void remote.registerSocket(1, socketCallbacks().callbacks);

    const cancelled = once(link!, 'unregister');
    remote.unregisterSocket(1);
    await cancelled;
    const lateRegistration = once(link!, 'unregister');
    connected.resolve();

    expect(await lateRegistration).to.deep.equal([100]);
    expect(link!.sockets.has(100)).to.equal(false);
  });

  it("closes a worker's upstream connections when its server is disposed", async function () {
    const remote = connectWorker();
    await remote.registerSocket(1, socketCallbacks().callbacks);
    await remote.registerSocket(2, socketCallbacks().callbacks);
    const sent = once(link!, 'sent');
    remote.sendData(1, 'cluster0.example.net', 27017, new Uint8Array([1]));
    await sent;

    served.dispose();

    expect(link!.sent.at(-1)).to.deep.equal({
      sp: 100,
      da: 'cluster0.example.net',
      dp: 27017,
      er: 'Utility worker closed',
    });
    expect(link!.sent).to.have.lengthOf(2);
    expect(link!.unregistered).to.deep.equal([100, 101]);
  });
});
