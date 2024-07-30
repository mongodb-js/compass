// import type { Worker } from 'worker_threads';
import type { MongoshBus } from '@mongosh/types';
import type { Exposed } from './rpc';
import { exposeAll, close } from './rpc';

export class WorkerProcessMongoshBus {
  exposedEmitter: Exposed<MongoshBus>;

  constructor(eventEmitter: MongoshBus, worker: Worker) {
    const exposedEmitter: Exposed<MongoshBus> = exposeAll(
      {
        emit(...args) {
          eventEmitter.emit(...args);
        },
        on() {
          throw new Error("Can't use `on` method on WorkerProcessMongoshBus");
        },
        once() {
          throw new Error("Can't use `once` method on WorkerProcessMongoshBus");
        },
      },
      worker
    );
    this.exposedEmitter = exposedEmitter;
  }

  terminate() {
    this.exposedEmitter[close]();
  }
}
