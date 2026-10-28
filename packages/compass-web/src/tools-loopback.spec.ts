import { expect } from 'chai';
import sinon from 'sinon';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { ToolsHost } from '@mongodb-js/compass-generative-ai/utility';
import {
  createToolsLoopbackChannel,
  openToolsLoopback,
} from './tools-loopback';

describe('tools loopback channel', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  function stubMessageChannel() {
    const port1 = { start: sinon.stub(), postMessage: sinon.stub() };
    const port2 = { start: sinon.stub(), postMessage: sinon.stub() };
    sandbox.replace(
      globalThis,
      'MessageChannel',
      sinon.stub().returns({ port1, port2 }) as unknown as typeof MessageChannel
    );
    return { port1, port2 };
  }

  it('starts both ends', function () {
    // A port that is never started queues messages forever: the renderer's
    // requests would never reach the in-page host, and its replies would never
    // come back.
    const { port1, port2 } = stubMessageChannel();

    createToolsLoopbackChannel();

    expect(port1.start).to.have.been.calledOnce;
    expect(port2.start).to.have.been.calledOnce;
  });

  it('gives the renderer one end and the host the other', function () {
    const { port1, port2 } = stubMessageChannel();

    const { openPort, hostPort } = createToolsLoopbackChannel();

    expect(openPort()).to.equal(port1);
    expect(hostPort).to.equal(port2);
  });

  it('opens a fresh port and host per open, so a closed one is never reused', function () {
    const hosts = new Set<ToolsHost>();
    const logger = createNoopLogger();

    const first = openToolsLoopback(hosts, logger);
    const second = openToolsLoopback(hosts, logger);

    expect(first).to.not.equal(second);
    expect(hosts.size).to.equal(2);
  });
});
