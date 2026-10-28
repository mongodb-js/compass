import { MessageChannel } from 'node:worker_threads';
import { expect } from 'chai';
import sinon from 'sinon';
import { createToolsRpcClient } from './rpc-client';
import { serveToolsRequests } from './server';

describe('tools rpc', function () {
  let channel: MessageChannel;

  beforeEach(function () {
    channel = new MessageChannel();
  });

  afterEach(function () {
    channel.port1.close();
    channel.port2.close();
  });

  it('round-trips a request to a response', async function () {
    const client = createToolsRpcClient(channel.port1);
    const params = { enableMCPTelemetry: true, maxTimeMS: 5 };
    serveToolsRequests(channel.port2, async (method, sentParams, _signal) => {
      expect(method).to.equal('setUserConfig');
      return Promise.resolve(sentParams);
    });

    expect(await client.call('setUserConfig', params)).to.deep.equal(params);
  });

  it('rejects with the error message from the other side', async function () {
    const client = createToolsRpcClient(channel.port1);
    serveToolsRequests(channel.port2, () => {
      throw new Error('boom');
    });

    const error = await client
      .call('performToolCall', { toolName: 'find' })
      .catch((err: Error) => err);
    expect(error).to.be.instanceOf(Error).with.property('message', 'boom');
  });

  it('propagates abort to the server-side signal', async function () {
    const client = createToolsRpcClient(channel.port1);
    const controller = new AbortController();
    let serverSignal: AbortSignal | undefined;

    // resolves only once the server side processed the abort message
    const serverAborted = new Promise<void>((resolve) => {
      serveToolsRequests(channel.port2, (_method, _params, signal) => {
        serverSignal = signal;
        return new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(signal.reason);
            resolve();
          });
        });
      });
    });

    const pending = client.call(
      'performToolCall',
      undefined,
      controller.signal
    );
    controller.abort(new Error('stop'));

    const error = await pending.catch((err: Error) => err);
    expect(error).to.be.instanceOf(Error).with.property('message', 'stop');
    await serverAborted;
    expect(serverSignal?.aborted).to.equal(true);
  });

  it('rejects immediately for an already-aborted signal', async function () {
    const client = createToolsRpcClient(channel.port1);
    serveToolsRequests(channel.port2, async () => Promise.resolve('unused'));

    const error = await client
      .call('performToolCall', undefined, AbortSignal.abort(new Error('nope')))
      .catch((err: Error) => err);
    expect(error).to.be.instanceOf(Error).with.property('message', 'nope');
  });

  it('resolves in request order regardless of completion order', async function () {
    const client = createToolsRpcClient(channel.port1);
    serveToolsRequests(channel.port2, async (_method, params, _signal) => {
      const { delay, name } = params as { delay: number; name: string };
      await new Promise((resolve) => setTimeout(resolve, delay));
      return name;
    });

    const slow = client.call('performToolCall', { delay: 50, name: 'slow' });
    const fast = client.call('performToolCall', { delay: 1, name: 'fast' });
    expect(await Promise.all([slow, fast])).to.deep.equal(['slow', 'fast']);
  });

  it('rejects pending calls when the client is closed', async function () {
    const client = createToolsRpcClient(channel.port1);
    // no server on the other end: the call stays pending until close()
    const pending = client.call('listDatabaseTools');
    client.close();

    const error = await pending.catch((err: Error) => err);
    expect(error)
      .to.be.instanceOf(Error)
      .with.property('message', 'Tools rpc client closed');
  });

  it('ignores messages that are not part of the protocol', async function () {
    let called = 0;
    const client = createToolsRpcClient(channel.port1);
    serveToolsRequests(channel.port2, () => {
      called += 1;
      return Promise.resolve(null);
    });
    channel.port1.postMessage({ hello: 'stray' });
    channel.port1.postMessage(null);
    channel.port1.postMessage({ kind: 'nonsense' });

    // Messages arrive in order, so a request that gets answered proves the
    // strays were seen and ignored rather than queued behind it
    await client.call('listDatabaseTools');

    expect(called).to.equal(1);
  });

  it('closes the port when the client is closed', function () {
    const close = sinon.spy(channel.port1, 'close');
    const client = createToolsRpcClient(channel.port1);

    client.close();

    expect(close).to.have.been.calledOnce;
    close.restore();
  });

  it('does not send an abort message for a request that already settled', async function () {
    const client = createToolsRpcClient(channel.port1);
    const controller = new AbortController();
    const postMessage = sinon.spy(channel.port1, 'postMessage');
    serveToolsRequests(channel.port2, () => Promise.resolve('ok'));

    await client.call('performToolCall', undefined, controller.signal);
    postMessage.resetHistory();

    // Abort listeners run synchronously, so no waiting is needed to know
    // whether the client still had one attached
    controller.abort(new Error('too late'));

    expect(postMessage).to.not.have.been.called;
    postMessage.restore();
  });

  it('aborts in-flight requests when the server is disposed', async function () {
    const client = createToolsRpcClient(channel.port1);
    let serverSignal: AbortSignal | undefined;
    // Resolved by the handler, so the test never has to guess how long a
    // message takes to arrive
    let requestArrived: () => void;
    const arrived = new Promise<void>((resolve) => {
      requestArrived = resolve;
    });
    const server = serveToolsRequests(
      channel.port2,
      (_method, _params, signal) => {
        serverSignal = signal;
        requestArrived();
        return new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason));
        });
      }
    );

    void client.call('performToolCall').catch(() => {
      // the request is aborted below; the rejection is expected
    });
    await arrived;

    server[Symbol.dispose]();

    expect(serverSignal?.aborted).to.equal(true);
  });
});
