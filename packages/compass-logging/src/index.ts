import { MongoLogWriter, mongoLogId } from 'mongodb-log-writer';
import type { Writable } from 'stream';
import ipc from 'hadron-ipc';

export function createLogger(component: string): {
  log: ReturnType<MongoLogWriter['bindComponent']>;
  mongoLogId: typeof mongoLogId;
} {
  // Do not create an actual Writable stream here, since the callback
  // logic in Node.js streams would mean that two writes from the
  // same event loop tick would not be written synchronously,
  // allowing another logger's write to be written out-of-order.
  const target = {
    write(line: string, callback: () => void) {
      // ipc.call is undefined outside of Electron
      ipc.call?.('compass:log', { line });
      (process as any).emit('compass:log', { line });
      callback();
    },
    end(callback: () => void) {
      callback();
    },
  } as Writable;
  const writer = new MongoLogWriter('', null, target);
  return {
    log: writer.bindComponent(component),
    mongoLogId,
  };
}

export default createLogger;
