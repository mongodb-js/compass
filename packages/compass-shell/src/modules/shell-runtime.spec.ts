import { expect } from 'chai';
import { waitUntil } from '@mongodb-js/compass-utils';
import { ShellRuntime } from './shell-runtime';

describe('ShellRuntime', function () {
  let renderer: MessagePort;
  let utility: MessagePort;
  let runtime: ShellRuntime;

  beforeEach(function () {
    const channel = new MessageChannel();
    renderer = channel.port1;
    utility = channel.port2;
    runtime = new ShellRuntime(
      renderer,
      '',
      { productName: 'Compass', productDocsLink: '' },
      { nodb: true }
    );
  });

  afterEach(function () {
    renderer.close();
    utility.close();
  });

  it('rejects startup when the utility reports an error', async function () {
    utility.postMessage({ meta: 'error', error: new Error('spawn failed') });
    const error = await runtime
      .waitForRuntimeToBeReady()
      .catch((err: Error) => err);
    expect(error)
      .to.be.instanceOf(Error)
      .with.property('message', 'spawn failed');
  });

  it('rejects startup when the utility process goes away', async function () {
    utility.close();
    const error = await runtime
      .waitForRuntimeToBeReady()
      .catch((err: Error) => err);
    expect(error)
      .to.be.instanceOf(Error)
      .with.property('message', 'The embedded shell utility process went away');
  });

  it('terminates even though startup never finished', async function () {
    utility.close();
    await runtime.terminate();
  });

  it('terminates while the utility never reports ready', async function () {
    const terminateRequest = waitUntil(
      utility,
      'message',
      ({ data }: MessageEvent) =>
        (data as { meta?: string }).meta === 'terminate'
    );
    utility.start();
    await runtime.terminate();
    await terminateRequest;
    const error = await runtime
      .waitForRuntimeToBeReady()
      .catch((err: Error) => err);
    expect(error)
      .to.be.instanceOf(Error)
      .with.property('message', 'Shell runtime terminated');
  });
});
