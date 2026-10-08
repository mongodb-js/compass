import { expect } from 'chai';
import process from 'node:process';
import { EventEmitter, once } from 'events';
import { MessageChannelMain } from 'electron';
import type { MessagePortMain, ParentPort } from 'electron';
import { main } from './index.mts';

describe('embedded-shell utility', function () {
  let parentPort: ParentPort;
  let shell: Disposable;
  let sentToMain: { channel: string; data: { line: string } }[];

  beforeEach(function () {
    sentToMain = [];
    parentPort = Object.assign(new EventEmitter(), {
      postMessage: (message: (typeof sentToMain)[number]) =>
        sentToMain.push(message),
    });
    shell = main(parentPort);
  });

  afterEach(function () {
    shell[Symbol.dispose]();
  });

  it('logs to main through parentPort', function () {
    expect(sentToMain).to.have.lengthOf(1);
    expect(sentToMain[0].channel).to.equal('compass:log');
    const entry = JSON.parse(sentToMain[0].data.line);
    expect(entry).to.include({
      s: 'I',
      c: 'EMBEDDED-SHELL',
      id: 1_001_000_442,
      ctx: 'Utility',
      msg: 'Started',
    });
    expect(entry.attr).to.include({ pid: process.pid, ppid: process.ppid });
    expect(entry.attr.startupMs).to.be.a('number');
  });

  describe('a shell session on a port', function () {
    let port: MessagePortMain;

    beforeEach(function () {
      const channel = new MessageChannelMain();
      port = channel.port1;
      parentPort.emit('message', { data: undefined, ports: [channel.port2] });
      port.start();
    });

    afterEach(function () {
      port.postMessage({ meta: 'terminate' });
      port.close();
    });

    it('replies that nothing was interrupted when nothing is running', async function () {
      port.postMessage({ meta: 'interrupt' });
      const [{ data }] = await once(port, 'message');
      expect(data).to.deep.equal({ meta: 'interrupted', interrupted: false });
    });

    it('starts the worker runtime in a worker thread', async function () {
      this.timeout(20_000);
      port.postMessage({ meta: 'spawn', workerOptions: { name: 'test' } });
      const [{ data }] = await once(port, 'message');
      expect(data).to.equal('ready');
    });
  });
});
