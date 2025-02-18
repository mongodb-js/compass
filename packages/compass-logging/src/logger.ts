import type { MongoLogEntry } from 'mongodb-log-writer/mongo-log-writer';
import {
  MongoLogWriter,
  mongoLogId,
} from 'mongodb-log-writer/mongo-log-writer';
import createDebug from 'debug';
import type { Writable } from 'stream';

export type Logger = {
  log: ReturnType<MongoLogWriter['bindComponent']>;
  mongoLogId: typeof mongoLogId;
  debug: ReturnType<typeof createDebug>;
};

export function createGenericLogger(
  component: string,
  emit: (event: string, arg: any) => void
): Logger {
  // Do not create an actual Writable stream here, since the callback
  // logic in Node.js streams would mean that two writes from the
  // same event loop tick would not be written synchronously,
  // allowing another logger's write to be written out-of-order.
  const target = {
    write(line: string, callback: () => void) {
      emit('compass:log', { line });
      callback();
    },
    end(callback: () => void) {
      callback();
    },
  } as Writable;
  const writer = new MongoLogWriter('', null, target);
  const log = writer.bindComponent(component);

  const debug = createDebug(`mongodb-compass:${component.toLowerCase()}`);
  writer.on('log', ({ s, ctx, msg, attr }: MongoLogEntry) => {
    if (attr) {
      debug(msg, { s, ctx, ...attr });
    } else {
      debug(msg, { s, ctx });
    }
  });
  return {
    log,
    mongoLogId,
    debug,
  };
}
