import type { ChildProcess } from 'child_process';
import type { Worker } from 'worker_threads';
import type { MongoshBus } from '@mongosh/types';
import type { Exposed } from './rpc';
import { exposeAll, close } from './rpc';

export class ChildProcessMongoshBus {
  exposedEmitter: Exposed<MongoshBus>;

  constructor(eventEmitter: MongoshBus, childProcess: ChildProcess | Worker) {
    const exposedEmitter: Exposed<MongoshBus> = exposeAll(
      {
        emit(...args) {
          eventEmitter.emit(...args);
        },
        on() {
          throw new Error("Can't use `on` method on ChildProcessMongoshBus");
        },
        once() {
          throw new Error("Can't use `once` method on ChildProcessMongoshBus");
        },
      },
      childProcess
    );
    this.exposedEmitter = exposedEmitter;
  }

  terminate() {
    this.exposedEmitter[close]();
  }
}
