import { MongoLogWriter, mongoLogId } from 'mongodb-log-writer';
import { Writable } from 'stream';
import ipc from 'hadron-ipc';

function createLogger(component: string): {
  log: ReturnType<MongoLogWriter['bindComponent']>;
  mongoLogId: typeof mongoLogId;
} {
  const target = new Writable({
    decodeStrings: false,
    write(line: string, encoding: unknown, callback: () => void) {
      // ipc.call is undefined outside of Electron
      ipc.call?.('compass:log', { line });
      (process as any).emit('compass:log', { line });
      callback();
    },
  });
  const writer = new MongoLogWriter('', null, target);
  return {
    log: writer.bindComponent(component),
    mongoLogId,
  };
}

export = createLogger;
