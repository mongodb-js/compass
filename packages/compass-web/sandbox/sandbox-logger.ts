import createDebug from 'debug';
import type { LogMessage } from '../src/logger-and-telemetry';

const logging: LogMessage[] = ((globalThis as any).logging = []);

const debug = createDebug(`mongodb-compass:compass-web-sandbox`);

export const sandboxLogger = {
  log: (event: any) => {
    logging.push(event);
  },

  debug,
};
