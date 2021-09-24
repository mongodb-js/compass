import { MongoLogWriter, MongoLogEntry, mongoLogId } from 'mongodb-log-writer';
import createDebug from 'debug';
import type { Writable } from 'stream';
import ipc from 'hadron-ipc';

export function createLogger(component: string): {
  log: ReturnType<MongoLogWriter['bindComponent']>;
  mongoLogId: typeof mongoLogId;
  debug: ReturnType<typeof createDebug>;
} {
  // Do not create an actual Writable stream here, since the callback
  // logic in Node.js streams would mean that two writes from the
  // same event loop tick would not be written synchronously,
  // allowing another logger's write to be written out-of-order.
  const target = {
    write(line: string, callback: () => void) {
      // ipc.callQuiet is undefined outside of Electron
      // We use ipc.callQuiet instead of ipc.call because we already
      // print debugging messages below
      ipc.callQuiet?.('compass:log', { line });
      (process as any).emit('compass:log', { line });
      callback();
    },
    end(callback: () => void) {
      callback();
    },
  } as Writable;
  const writer = new MongoLogWriter('', null, target);
  const debug = createDebug(`mongodb-compass:${component.toLowerCase()}`);
  writer.on('log', ({ s, ctx, msg, attr }: MongoLogEntry) => {
    if (attr) {
      debug(msg, { s, ctx, ...attr });
    } else {
      debug(msg, { s, ctx });
    }
  });
  return {
    log: writer.bindComponent(component),
    mongoLogId,
    debug,
  };
}

export default createLogger;
