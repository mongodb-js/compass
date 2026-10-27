import { expect } from 'chai';
import process from 'node:process';
import { EventEmitter } from 'node:events';
import type { MessagePortMain, ParentPort } from 'electron';
import { main } from './index.mts';

function createFakePort(): MessagePortMain & { sent: unknown[] } {
  const sent: unknown[] = [];
  return Object.assign(new EventEmitter(), {
    sent,
    postMessage: (message: unknown) => sent.push(message),
    start: () => {},
  }) as unknown as MessagePortMain & { sent: unknown[] };
}

describe('ai-assistant utility', function () {
  let parentPort: ParentPort;
  let utility: Disposable;
  let sentToMain: { channel: string; data: { line: string } }[];

  beforeEach(function () {
    sentToMain = [];
    parentPort = Object.assign(new EventEmitter(), {
      postMessage: (message: (typeof sentToMain)[number]) =>
        sentToMain.push(message),
    });
    utility = main(parentPort);
  });

  afterEach(function () {
    utility[Symbol.dispose]();
  });

  it('logs to main through parentPort', function () {
    expect(sentToMain).to.have.lengthOf(1);
    expect(sentToMain[0].channel).to.equal('compass:log');
    const entry = JSON.parse(sentToMain[0].data.line);
    expect(entry).to.include({
      s: 'I',
      c: 'AI-ASSISTANT',
      id: 1_001_000_442,
      ctx: 'Utility',
      msg: 'Started',
    });
    expect(entry.attr).to.include({ pid: process.pid, ppid: process.ppid });
    expect(entry.attr.startupMs).to.be.a('number');
  });

  it('serves rpc requests arriving on a handed-over port', async function () {
    this.timeout(10_000);
    const port = createFakePort();
    parentPort.emit('message', { ports: [port] });

    port.emit('message', {
      data: {
        kind: 'request',
        id: 1,
        method: 'listDatabaseTools',
        params: null,
      },
    });

    const deadline = Date.now() + 9_000;
    while (port.sent.length === 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    expect(port.sent).to.have.lengthOf(1);
    const response = port.sent[0] as {
      kind: string;
      id: number;
      ok: boolean;
      result: { name: string }[];
    };
    expect(response).to.include({ kind: 'response', id: 1, ok: true });
    expect(response.result.map((tool) => tool.name)).to.include('find');
  });

  it('stops serving requests when the port closes', async function () {
    this.timeout(10_000);
    const port = createFakePort();
    parentPort.emit('message', { ports: [port] });
    // let the host attach its listeners
    await new Promise((resolve) => setTimeout(resolve, 0));

    port.emit('close');
    port.emit('message', {
      data: {
        kind: 'request',
        id: 1,
        method: 'listDatabaseTools',
        params: null,
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(port.sent).to.have.lengthOf(0);
  });
});
