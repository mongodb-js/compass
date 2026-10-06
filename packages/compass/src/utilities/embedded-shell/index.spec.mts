import { expect } from 'chai';
import { EventEmitter, once } from 'events';
import { MessageChannelMain } from 'electron';
import type { ParentPort } from 'electron';
import { main } from './index.mts';

describe('embedded-shell utility', function () {
  it('answers on a port handed over by main', async function () {
    const parentPort = new EventEmitter() as unknown as ParentPort;
    main(parentPort);

    const { port1, port2 } = new MessageChannelMain();
    parentPort.emit('message', { data: undefined, ports: [port2] });
    port1.start();
    port1.postMessage('hello');

    const [{ data }] = await once(port1, 'message');
    expect(data).to.equal('hello');
  });
});
