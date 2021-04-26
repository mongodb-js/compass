import path from 'path';
import { ChildProcess, fork } from 'child_process';
import { Caller, cancel, createCaller } from './rpc';
import { expect } from 'chai';
import { WorkerRuntime } from './worker-runtime';

const childProcessModulePath = path.resolve(
  __dirname,
  '..',
  'dist',
  'child-process-proxy.js'
);

describe('child process worker proxy', () => {
  let caller: Caller<WorkerRuntime>;
  let childProcess: ChildProcess;

  afterEach(() => {
    if (caller) {
      caller[cancel]();
      caller = null;
    }

    if (childProcess) {
      childProcess.kill('SIGTERM');
      childProcess = null;
    }
  });

  it('should start worker runtime and proxy calls', async() => {
    childProcess = fork(childProcessModulePath);
    caller = createCaller(['init', 'evaluate'], childProcess);
    await caller.init('mongodb://nodb/', {}, { nodb: true });
    const result = await caller.evaluate('1 + 1');
    expect(result.printable).to.equal(2);
  });
});
