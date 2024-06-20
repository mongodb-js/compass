import createDebug from 'debug';

const logging: { name: string; component: string; args: any[] }[] = ((
  globalThis as any
).logging = []);

const debug = createDebug(`mongodb-compass:compass-web-sandbox`);

export const sandboxLogger = {
  log: (name: string, component: string, ...args: any[]) => {
    logging.push({ name, component, args });
  },

  debug,
};
