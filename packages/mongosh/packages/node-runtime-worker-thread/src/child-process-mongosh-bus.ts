import { ChildProcess } from 'child_process';
import { MongoshBus } from '@mongosh/types';
import { exposeAll, Exposed, close } from './rpc';

export class ChildProcessMongoshBus {
  exposedEmitter: Exposed<MongoshBus>;

  constructor(eventEmitter: MongoshBus, childProcess: ChildProcess) {
    const exposedEmitter: Exposed<MongoshBus> = exposeAll(
      {
        emit(...args) {
          eventEmitter.emit(...args);
        },
        on() {
          throw new Error("Can't use `on` method on ChildProcessMongoshBus");
        }
      },
      childProcess
    );
    this.exposedEmitter = exposedEmitter;
  }

  terminate() {
    this.exposedEmitter[close]();
  }
}
