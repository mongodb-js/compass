import { EventEmitter } from 'node:events';
import { expect } from 'chai';
import { once } from '@mongodb-js/compass-utils';
import type { UtilityParentPort } from '../ipc.mts';
import { main } from './index.mts';

describe('hello-world utility', function () {
  let parentPort: EventEmitter & UtilityParentPort;
  let utility: Disposable;
  let sentToHost: { channel: string; data: { line: string } }[];
  let port: MessagePort;

  beforeEach(function () {
    sentToHost = [];
    parentPort = Object.assign(new EventEmitter(), {
      postMessage: (message: (typeof sentToHost)[number]) =>
        sentToHost.push(message),
    });
    utility = main(parentPort);
    const channel = new MessageChannel();
    port = channel.port1;
    parentPort.emit('message', { data: undefined, ports: [channel.port2] });
    port.start();
  });

  afterEach(function () {
    port.close();
    utility[Symbol.dispose]();
  });

  it('logs its startup to the host', function () {
    expect(sentToHost).to.have.lengthOf(1);
    expect(sentToHost[0].channel).to.equal('compass:log');
    expect(JSON.parse(sentToHost[0].data.line)).to.include({
      c: 'HELLO-WORLD',
      id: 1_001_000_442,
      msg: 'Started',
    });
  });

  it('replies to a message on a port it was handed', async function () {
    port.postMessage('world');
    const [{ data }] = await once<[MessageEvent]>(port, 'message');
    expect(data).to.deep.equal({ hello: 'world' });
  });
});
