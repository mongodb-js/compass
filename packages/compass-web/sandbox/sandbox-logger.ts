import createDebug from 'debug';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import type { Logger } from '@mongodb-js/compass-logging';
import type { MongoLogWriter } from 'mongodb-log-writer';

const logging: { name: string; component: string; args: any[] }[] = ((
  globalThis as any
).logging = []);

export const sandboxLogger = {
  createLogger: (component = 'SANDBOX-LOGGER'): Logger => {
    const logger = (name: 'debug' | 'info' | 'warn' | 'error' | 'fatal') => {
      return (...args: any[]) => {
        logging.push({ name, component, args });
      };
    };

    const debug = createDebug(`mongodb-compass:${component.toLowerCase()}`);

    return {
      log: {
        component,
        get unbound() {
          return this as unknown as MongoLogWriter;
        },
        write: () => true,
        debug: logger('debug'),
        info: logger('info'),
        warn: logger('warn'),
        error: logger('error'),
        fatal: logger('fatal'),
      },
      debug,
      mongoLogId,
    };
  },
};
