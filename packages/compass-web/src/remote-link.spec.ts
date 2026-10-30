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

class FakeLink implements MultiplexLink {
  private nextPort = 100;
  readonly sockets = new Map<number, MultiplexSocketCallbacks>();
  readonly unregistered: number[] = [];
  private sent = Promise.withResolvers<Sent>();

  allocatePort(): number {
    return this.nextPort++;
  }
  registerSocket(sp: number, callbacks: MultiplexSocketCallbacks) {
    this.sockets.set(sp, callbacks);
    return Promise.resolve();
  }
  unregisterSocket(sp: number): void {
    this.unregistered.push(sp);
    this.sockets.delete(sp);
  }
  sendData(sp: number, da: string, dp: number, data: Uint8Array): void {
    this.sent.resolve({ sp, da, dp, data });
  }
  sendError(sp: number, da: string, dp: number, er: string): void {
    this.sent.resolve({ sp, da, dp, er });
  }
  /** Resolves with the next frame a worker's socket sends through the link */
  nextSent(): Promise<Sent> {
    const { promise } = this.sent;
    void promise.then(() => (this.sent = Promise.withResolvers<Sent>()));
    return promise;
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

    const sent = link!.nextSent();
    remote.sendData(sp, 'cluster0.example.net', 27017, Buffer.from('ping'));
    expect(await sent).to.deep.include({
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

    const sent = link!.nextSent();
    remote.sendError(1, 'cluster0.example.net', 27017, 'socket closed');

    expect(await sent).to.deep.equal({
      sp: 100,
      da: 'cluster0.example.net',
      dp: 27017,
      er: 'socket closed',
    });
  });

  it("unregisters a worker's open sockets when its server is disposed", async function () {
    const remote = connectWorker();
    await remote.registerSocket(1, socketCallbacks().callbacks);
    await remote.registerSocket(2, socketCallbacks().callbacks);

    served.dispose();

    expect(link!.unregistered).to.deep.equal([100, 101]);
  });
});
