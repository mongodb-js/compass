import { MongoLogWriter, MongoLogEntry, mongoLogId } from 'mongodb-log-writer';
import isElectronRenderer from 'is-electron-renderer';
import createDebug from 'debug';
import type { Writable } from 'stream';
import type { HadronIpcRenderer } from 'hadron-ipc';

function emit(
  ipc: HadronIpcRenderer | null,
  event: string,
  data: Record<string, any>
): void {
  // We use ipc.callQuiet instead of ipc.call because we already
  // print debugging messages below
  ipc?.callQuiet?.(event, data);
  if (typeof process !== 'undefined' && typeof process.emit === 'function') {
    (process as any).emit(event, data);
  }
}

export function createLogger(component: string): {
  log: ReturnType<MongoLogWriter['bindComponent']>;
  mongoLogId: typeof mongoLogId;
  debug: ReturnType<typeof createDebug>;
  track: (event: string, properties: Record<string, any>) => void;
} {
  // This application may not be running in an Node.js/Electron context.
  const ipc: HadronIpcRenderer | null = isElectronRenderer
    ? require('hadron-ipc')
    : null;

  // Do not create an actual Writable stream here, since the callback
  // logic in Node.js streams would mean that two writes from the
  // same event loop tick would not be written synchronously,
  // allowing another logger's write to be written out-of-order.
  const target = {
    write(line: string, callback: () => void) {
      emit(ipc, 'compass:log', { line });
      callback();
    },
    end(callback: () => void) {
      callback();
    },
  } as Writable;
  const writer = new MongoLogWriter('', null, target);

  const track = (event: string, properties: Record<string, any>): void => {
    emit(ipc, 'compass:track', { event, properties });
  };

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
    track,
  };
}

export default createLogger;
