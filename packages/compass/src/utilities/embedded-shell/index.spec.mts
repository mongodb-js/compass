import { expect } from 'chai';
import process from 'node:process';
import { EventEmitter } from 'node:events';
import type { ParentPort } from 'electron';
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
});
