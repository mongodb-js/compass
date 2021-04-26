import { expect } from 'chai';
import { EventEmitter } from 'events';

import {
  createCaller,
  exposeAll,
  close,
  cancel,
  Caller,
  Exposed,
  serialize,
  deserialize,
  removeTrailingUndefined
} from './rpc';

function createMockRpcMesageBus() {
  const bus = new (class Bus extends EventEmitter {
    send(data: any) {
      this.emit('message', data);
    }
  })();
  return bus;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('rpc helpers', () => {
  describe('serialize', () => {
    it('returns base64 representation of an input', () => {
      expect(serialize('Hello')).to.equal('data:;base64,/w0iBUhlbGxv');
    });
  });

  describe('deserialize', () => {
    it("converts base64 representation of input back to it's original form", () => {
      expect(deserialize(serialize('Hello'))).to.equal('Hello');
    });

    it("returns original string if it's not a base64 data uri", () => {
      expect(deserialize('Hi')).to.equal('Hi');
    });
  });

  describe('removeTrailingUndefined', () => {
    it('removes trailing undefineds from an array', () => {
      expect(
        removeTrailingUndefined([1, 2, 3, undefined, undefined, undefined])
      ).to.deep.equal([1, 2, 3]);
    });
  });
});

describe('rpc', () => {
  let messageBus: EventEmitter;
  let caller: Caller<{
    meow(...args: any[]): string;
    throws(...args: any[]): never;
    callMe(...args: any[]): void;
    returnsFunction(...args: any[]): Function;
    woof(...args: any[]): string;
    neverResolves(...args: any[]): void;
  }>;
  let exposed: Exposed<unknown>;

  afterEach(() => {
    if (messageBus) {
      messageBus.removeAllListeners();
      messageBus = null;
    }

    if (caller) {
      caller[cancel]();
      caller = null;
    }

    if (exposed) {
      exposed[close]();
      exposed = null;
    }
  });

  it('exposes functions and allows to call them', async() => {
    messageBus = createMockRpcMesageBus();
    caller = createCaller(['meow'], messageBus);

    exposed = exposeAll(
      {
        meow() {
          return 'Meow meow meow!';
        }
      },
      messageBus
    );

    expect(await caller.meow()).to.equal('Meow meow meow!');
  });

  it('serializes and de-serializes errors when thrown', async() => {
    messageBus = createMockRpcMesageBus();
    caller = createCaller(['throws'], messageBus);

    exposed = exposeAll(
      {
        throws() {
          throw new TypeError('Uh-oh, error!');
        }
      },
      messageBus
    );

    let err: Error;

    try {
      await caller.throws();
    } catch (e) {
      err = e;
    }

    expect(err).to.be.instanceof(Error);
    expect(err).to.have.property('name', 'TypeError');
    expect(err).to.have.property('message', 'Uh-oh, error!');
    expect(err)
      .to.have.property('stack')
      .match(/TypeError: Uh-oh, error!\r?\n\s+at throws/);
  });

  it('throws on client if arguments are not serializable', async() => {
    messageBus = createMockRpcMesageBus();
    caller = createCaller(['callMe'], messageBus);

    exposed = exposeAll(
      {
        callMe(fn: any) {
          fn(1, 2);
        }
      },
      messageBus
    );

    let err: Error;

    try {
      await caller.callMe((a: number, b: number) => a + b);
    } catch (e) {
      err = e;
    }

    expect(err).to.be.instanceof(Error);
    expect(err)
      .to.have.property('message')
      .match(/could not be cloned/);
  });

  it('throws on client if retured value from the server is not serializable', async() => {
    messageBus = createMockRpcMesageBus();
    caller = createCaller(['returnsFunction'], messageBus);

    exposed = exposeAll(
      {
        returnsFunction() {
          return () => {};
        }
      },
      messageBus
    );

    let err: Error;

    try {
      await caller.returnsFunction();
    } catch (e) {
      err = e;
    }

    expect(err).to.be.instanceof(Error);
    expect(err)
      .to.have.property('message')
      .match(/could not be cloned/);
  });

  describe('createCaller', () => {
    it('creates a caller with provided method names', () => {
      messageBus = createMockRpcMesageBus();
      caller = createCaller(['meow', 'woof'], messageBus);
      expect(caller).to.have.property('meow');
      expect(caller).to.have.property('woof');
    });

    it('attaches caller listener to provided process', (done) => {
      messageBus = createMockRpcMesageBus();
      caller = createCaller(['meow'], messageBus);

      messageBus.on('message', (data) => {
        expect(data).to.have.property('func', 'meow');
        done();
      });

      caller.meow().catch(() => {
        /* meow will be cancelled, noop to avoid unhandled rejection */
      });
    });

    describe('cancel', () => {
      it('stops all in-flight evaluations', async() => {
        messageBus = createMockRpcMesageBus();
        caller = createCaller(['neverResolves'], messageBus);
        let err: Error;
        try {
          await Promise.all([
            caller.neverResolves(),
            (async() => {
              // smol sleep to make sure we actually issued a call
              await sleep(100);
              caller[cancel]();
            })()
          ]);
        } catch (e) {
          err = e;
        }
        expect(err).to.be.instanceof(Error);
        expect(err).to.have.property('isCanceled', true);
      });
    });
  });

  describe('exposeAll', () => {
    it('exposes passed methods on provided process', (done) => {
      messageBus = createMockRpcMesageBus();

      exposed = exposeAll(
        {
          meow() {
            return 'Meow meow meow meow!';
          }
        },
        messageBus
      );

      messageBus.on('message', (data: any) => {
        // Due to how our mocks implemented we have to introduce an if here to
        // skip our own message being received by the message bus
        if (data.sender === 'postmsg-rpc/server') {
          expect(data).to.have.property('id', '123abc');
          expect(data).to.have.nested.property(
            'res.payload',
            'Meow meow meow meow!'
          );
          done();
        }
      });

      messageBus.emit('message', {
        sender: 'postmsg-rpc/client',
        func: 'meow',
        id: '123abc'
      });
    });

    describe('close', () => {
      it('disables all exposed listeners', () => {
        messageBus = createMockRpcMesageBus();
        exposed = exposeAll({ doSomething() {} }, messageBus);
        expect(messageBus.listenerCount('message')).to.equal(1);
        exposed[close]();
        expect(messageBus.listenerCount('message')).to.equal(0);
      });
    });
  });
});
