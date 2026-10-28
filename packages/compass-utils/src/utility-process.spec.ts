import { expect } from 'chai';
import sinon from 'sinon';
import { openUtilityPort, utilityPortChannel } from './utility-process';

describe('openUtilityPort', function () {
  let sandbox: sinon.SinonSandbox;
  let originalWindow: unknown;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    originalWindow = (globalThis as any).window;
  });

  afterEach(function () {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
    sandbox.restore();
  });

  function stubMessageChannel() {
    const port1 = { start: sinon.stub(), postMessage: sinon.stub() };
    const port2 = {};
    sandbox.replace(
      globalThis,
      'MessageChannel',
      sinon.stub().returns({ port1, port2 }) as unknown as typeof MessageChannel
    );
    const postMessage = sinon.stub();
    (globalThis as any).window = { postMessage };
    return { port1, port2, postMessage };
  }

  it('hands the other end to the preload on the utility channel', function () {
    const { port2, postMessage } = stubMessageChannel();

    openUtilityPort('ai-assistant');

    expect(postMessage).to.have.been.calledOnceWith(
      { type: utilityPortChannel('ai-assistant') },
      '*',
      [port2]
    );
  });

  it('starts the port it returns', function () {
    const { port1 } = stubMessageChannel();

    const port = openUtilityPort('ai-assistant');

    expect(port).to.equal(port1);
    expect(port1.start).to.have.been.calledOnce;
  });
});
