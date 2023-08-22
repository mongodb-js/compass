import Sinon from 'sinon';
import { expect } from 'chai';
import { promisify } from 'util';
import { ipcExpose, ipcInvoke, ControllerMap } from './ipc';

const wait = promisify(setTimeout);

describe('ipc', function () {
  const sandbox = Sinon.createSandbox();

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
  };

  afterEach(function () {
    mockIpc.handlers.clear();
    sandbox.resetHistory();
  });

  it('should pass arguments from invoker to handler', async function () {
    ipcExpose('Test', mockHandler, ['foo'], mockIpc, true);
    const { foo } = ipcInvoke<typeof mockHandler, 'foo'>(
      'Test',
      ['foo'],
      mockIpc
    );

    await foo({ test: 1 });

    expect(mockHandler.foo).to.have.been.calledOnceWith({
      signal: new AbortController().signal,
      test: 1,
    });
  });

  it('should return handler result when invoked', async function () {
    ipcExpose('Test', mockHandler, ['foo'], mockIpc, true);
    const { foo } = ipcInvoke<typeof mockHandler, 'foo'>(
      'Test',
      ['foo'],
      mockIpc
    );

    const res = await foo({ test: 1 });

    expect(res).to.eq(42);
  });

  it('should serialize and de-serialize errors when thrown in handler', async function () {
    ipcExpose('Test', mockHandler, ['bar'], mockIpc, true);
    const { bar } = ipcInvoke<typeof mockHandler, 'bar'>(
      'Test',
      ['bar'],
      mockIpc
    );

    try {
      await bar();
      expect.fail('Expected bar() to throw');
    } catch (err) {
      expect(err).to.have.property('message', 'Whoops!');
    }
  });

  it('should handle signals being passed from invoker to handler', async function () {
    ipcExpose('Test', mockHandler, ['buz'], mockIpc, true);
    const { buz } = ipcInvoke<typeof mockHandler, 'buz'>(
      'Test',
      ['buz'],
      mockIpc
    );

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
    ipcExpose('Test', mockHandler, ['foo'], mockIpc, true);
    const { foo } = ipcInvoke<typeof mockHandler, 'foo'>(
      'Test',
      ['foo'],
      mockIpc
    );

    await foo();
    await foo();
    await Promise.all([foo(), foo(), foo()]);
    await foo();

    expect(ControllerMap).to.have.property('size', 0);
  });
});
