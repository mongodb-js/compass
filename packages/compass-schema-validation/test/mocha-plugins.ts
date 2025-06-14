import { EventEmitter } from 'events';

const setupIpc = () => {
  let preferences = {};
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('hadron-ipc').ipcRenderer = Object.assign(new EventEmitter(), {
    createInvoke: (name: string, methods: string[]) => {
      return Object.fromEntries(methods.map((m) => [m, () => {}]));
    },
    invoke: (name: string, attributes: object) => {
      if (name === 'compass:save-preferences') {
        preferences = { ...preferences, ...attributes };
      } else if (name === 'test:clear-preferences') {
        preferences = {};
      } else if (name === 'compass:get-preference-sandbox-properties') {
        return Promise.resolve('');
      }
      return Promise.resolve(preferences);
    },
  });
};

setupIpc();
