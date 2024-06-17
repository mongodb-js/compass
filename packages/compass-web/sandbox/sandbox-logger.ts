import createDebug from 'debug';

const tracking: { event: string; properties: any }[] = ((
  globalThis as any
).tracking = []);

const logging: { name: string; component: string; args: any[] }[] = ((
  globalThis as any
).logging = []);

const debug = createDebug(`mongodb-compass:compass-web-sandbox`);

export const sandboxLogger = {
  log: (name: string, component: string, ...args: any[]) => {
    logging.push({ name, component, args });
  },

  track: (event: string, properties: any) => {
    tracking.push({ event, properties });
  },

  debug,
};
