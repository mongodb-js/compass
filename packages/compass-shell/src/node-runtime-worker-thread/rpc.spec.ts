import { expect } from 'chai';
import { EventEmitter } from 'events';

import type { Caller, Exposed } from './rpc';
import {
  createCaller,
  exposeAll,
  close,
  cancel,
  serialize,
  deserialize,
  removeTrailingUndefined,
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

describe('rpc helpers', function () {
  describe('serialize', function () {
    it('returns base64 representation of an input', function () {
      expect(serialize('Hello')).to.match(/data:;base64,\/w[08]iBUhlbGxv/);
    });
  });

  describe('deserialize', function () {
    it("converts base64 representation of input back to it's original form", function () {
      expect(deserialize(serialize('Hello'))).to.equal('Hello');
    });

    it("returns original string if it's not a base64 data uri", function () {
      expect(deserialize('Hi')).to.equal('Hi');
    });
  });

  describe('removeTrailingUndefined', function () {
    it('removes trailing undefineds from an array', function () {
      expect(
        removeTrailingUndefined([1, 2, 3, undefined, undefined, undefined])
      ).to.deep.equal([1, 2, 3]);
    });
  });
});

describe('rpc', function () {
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

  afterEach(function () {
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

  it('exposes functions and allows to call them', async function () {
    messageBus = createMockRpcMesageBus();
    caller = createCaller(['meow'], messageBus);

    exposed = exposeAll(
      {
        meow() {
          return 'Meow meow meow!';
        },
      },
      messageBus
    );

    expect(await caller.meow()).to.equal('Meow meow meow!');
  });

  it('serializes and de-serializes errors when thrown', async function () {
    messageBus = createMockRpcMesageBus();
    caller = createCaller(['throws'], messageBus);

    exposed = exposeAll(
      {
        throws() {
          throw new TypeError('Uh-oh, error!');
        },
      },
      messageBus
    );

    let err: Error;

    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await caller.throws();
    } catch (e: any) {
      err = e;
    }

    expect(err).to.be.instanceof(Error);
    expect(err).to.have.property('name', 'TypeError');
    expect(err).to.have.property('message', 'Uh-oh, error!');
    expect(err)
      .to.have.property('stack')
      .match(/TypeError: Uh-oh, error!\r?\n\s+at throws/);
  });

  it('throws on client if arguments are not serializable', async function () {
    messageBus = createMockRpcMesageBus();
    caller = createCaller(['callMe'], messageBus);

    exposed = exposeAll(
      {
        callMe(fn: any) {
          fn(1, 2);
        },
      },
      messageBus
    );

    let err: Error;

    try {
      await caller.callMe((a: number, b: number) => a + b);
    } catch (e: any) {
      err = e;
    }

    expect(err).to.be.instanceof(Error);
    expect(err)
      .to.have.property('message')
      .match(/could not be cloned/);
  });

  it('throws on client if retured value from the server is not serializable', async function () {
    messageBus = createMockRpcMesageBus();
    caller = createCaller(['returnsFunction'], messageBus);

    exposed = exposeAll(
      {
        returnsFunction() {
          return () => {};
        },
      },
      messageBus
    );

    let err: Error;

    try {
      await caller.returnsFunction();
    } catch (e: any) {
      err = e;
    }

    expect(err).to.be.instanceof(Error);
    expect(err)
      .to.have.property('message')
      .match(/could not be cloned/);
  });

  describe('createCaller', function () {
    it('creates a caller with provided method names', function () {
      messageBus = createMockRpcMesageBus();
      caller = createCaller(['meow', 'woof'], messageBus);
      expect(caller).to.have.property('meow');
      expect(caller).to.have.property('woof');
    });

    it('attaches caller listener to provided process', function (done) {
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

    describe('cancel', function () {
      it('stops all in-flight evaluations', async function () {
        messageBus = createMockRpcMesageBus();
        caller = createCaller(['neverResolves'], messageBus);
        let err: Error;
        try {
          await Promise.all([
            caller.neverResolves(),
            (async () => {
              // smol sleep to make sure we actually issued a call
              await sleep(100);
              caller[cancel]();
            })(),
          ]);
        } catch (e: any) {
          err = e;
        }
        expect(err).to.be.instanceof(Error);
        expect(err).to.have.property('isCanceled', true);
      });
    });
  });

  describe('exposeAll', function () {
    it('exposes passed methods on provided process', function (done) {
      messageBus = createMockRpcMesageBus();

      exposed = exposeAll(
        {
          meow() {
            return 'Meow meow meow meow!';
          },
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
        id: '123abc',
      });
    });

    describe('close', function () {
      it('disables all exposed listeners', function () {
        messageBus = createMockRpcMesageBus();
        exposed = exposeAll({ doSomething() {} }, messageBus);
        expect(messageBus.listenerCount('message')).to.equal(1);
        exposed[close]();
        expect(messageBus.listenerCount('message')).to.equal(0);
      });
    });
  });
});
