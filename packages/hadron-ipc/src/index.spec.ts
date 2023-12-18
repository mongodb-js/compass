import Sinon from 'sinon';
import { expect } from 'chai';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { ipcHandle, ControllerMap, respondTo } from './main';
import { ipcInvoke, call } from './renderer';

const wait = promisify(setTimeout);

const sandbox = Sinon.createSandbox();

describe('ipcHandle / ipcInvoke', function () {
  const MockIpc = class {
    handlers = new Map<string, (...args: any[]) => any>();
    handle = sandbox
      .stub()
      .callsFake((channel: string, fn: (_evt: any, ...args: any[]) => any) => {
        this.handlers.set(channel, fn);
      });
    async invoke(channel: string, ...args: any[]) {
      return await this.handlers.get(channel)?.({}, ...args);
    }
  };

  const mockIpc = new MockIpc();

  const mockHandler = {
    foo: sandbox.stub().resolves(42),
    bar: sandbox.stub().rejects(new Error('Whoops!')),
    buz: sandbox.stub().callsFake(({ signal }: { signal: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        if (signal.aborted) {
          throw signal.reason;
        }
        signal.addEventListener('abort', () => {
          reject(signal.reason);
        });
      });
    }),
    throwsErrorWithExtraParams: sandbox.stub().rejects(
      Object.assign(new Error('Error!'), {
        name: 'SpecialError',
        foo: 1,
        bar: 'a',
        nonSerializeable() {},
      })
    ),
  };

  afterEach(function () {
    mockIpc.handlers.clear();
    sandbox.resetHistory();
  });

  it('should pass arguments from invoker to handler', async function () {
    ipcHandle(mockIpc, 'Test', mockHandler, ['foo'], true);
    const { foo } = ipcInvoke<typeof mockHandler, 'foo'>(mockIpc, 'Test', [
      'foo',
    ]);

    await foo({ test: 1 });

    expect(mockHandler.foo).to.have.been.calledOnceWith({
      signal: new AbortController().signal,
      test: 1,
    });
  });

  it('should return handler result when invoked', async function () {
    ipcHandle(mockIpc, 'Test', mockHandler, ['foo'], true);
    const { foo } = ipcInvoke<typeof mockHandler, 'foo'>(mockIpc, 'Test', [
      'foo',
    ]);

    const res = await foo({ test: 1 });

    expect(res).to.eq(42);
  });

  it('should serialize and de-serialize errors when thrown in handler', async function () {
    ipcHandle(mockIpc, 'Test', mockHandler, ['bar'], true);
    const { bar } = ipcInvoke<typeof mockHandler, 'bar'>(mockIpc, 'Test', [
      'bar',
    ]);

    try {
      await bar();
      expect.fail('Expected bar() to throw');
    } catch (err) {
      expect(err).to.have.property('message', 'Whoops!');
    }
  });

  it('should pass extra properies from thrown errors', async function () {
    ipcHandle(
      mockIpc,
      'Test',
      mockHandler,
      ['throwsErrorWithExtraParams'],

      true
    );
    const { throwsErrorWithExtraParams } = ipcInvoke<
      typeof mockHandler,
      'throwsErrorWithExtraParams'
    >(mockIpc, 'Test', ['throwsErrorWithExtraParams']);

    try {
      await throwsErrorWithExtraParams();
      expect.fail('Expected throwsErrorWithExtraParams() to throw');
    } catch (err) {
      expect(err).to.have.property('name', 'SpecialError');
      expect(err).to.have.property('message', 'Error!');
      expect(err).to.have.property('stack');
      expect(err).to.have.property('foo', 1);
      expect(err).to.have.property('bar', 'a');
      // Testing that non-serializeable values are ignored
      expect(err).to.not.have.property('nonSerializeable');
    }
  });

  it('should handle signals being passed from invoker to handler', async function () {
    ipcHandle(mockIpc, 'Test', mockHandler, ['buz'], true);
    const { buz } = ipcInvoke<typeof mockHandler, 'buz'>(mockIpc, 'Test', [
      'buz',
    ]);

    const invokeController = new AbortController();

    const promise = buz({ signal: invokeController.signal });

    // Wait a bit before aborting so that we don't throw right in the invoker
    await wait(100);

    expect(ControllerMap).to.have.property('size', 1);

    const [handlerController] = Array.from(ControllerMap.values());

    invokeController.abort();

    try {
      await promise;
      expect.fail('Expected promise to throw abort error');
    } catch (err) {
      expect(handlerController).to.have.nested.property('signal.aborted', true);
      expect(err).to.have.property('message', 'This operation was aborted');
    }
  });

  it('should clean up abort controllers when handlers are executed', async function () {
    ipcHandle(mockIpc, 'Test', mockHandler, ['foo'], true);
    const { foo } = ipcInvoke<typeof mockHandler, 'foo'>(mockIpc, 'Test', [
      'foo',
    ]);

    await foo();
    await foo();
    await Promise.all([foo(), foo(), foo()]);
    await foo();

    expect(ControllerMap).to.have.property('size', 0);
  });
});

describe('call / respondTo', function () {
  const MockIpc = class {
    _emitter = new EventEmitter();
    on(name: string, fn: (...args: any[]) => void) {
      this._emitter.on(name, (...args: any[]) => {
        fn({ sender: this }, ...args);
      });
      return this;
    }
    removeAllListeners(name: string) {
      this._emitter.removeAllListeners(name);
    }
    send(name: string, ...args: any[]) {
      this._emitter.emit(name, ...args);
    }
    isDestroyed() {
      return false;
    }
  };

  const mockIpc = new MockIpc();

  afterEach(function () {
    mockIpc._emitter.removeAllListeners();
    sandbox.resetHistory();
  });

  it('should respond to the call', async function () {
    respondTo(mockIpc as any, 'returnFortyTwo', function () {
      return 42;
    });
    const res = await call(mockIpc as any, () => {}, 'returnFortyTwo');
    expect(res).to.eq(42);
  });

  it('should pass arguments through the channel', async function () {
    respondTo(mockIpc as any, 'returnPassedValue', function (_evt, value) {
      return value;
    });
    const res = await call(mockIpc as any, () => {}, 'returnPassedValue', 24);
    expect(res).to.eq(24);
  });
});
