import { EventEmitter } from 'events';

const setupIpc = () => {
  let preferences = {};
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('hadron-ipc').ipcRenderer = Object.assign(new EventEmitter(), {
    invoke: (name: string, attributes: object) => {
      if (name === 'compass:save-preferences') {
        preferences = { ...preferences, ...attributes };
      } else if (name === 'test:clear-preferences') {
        preferences = {};
      }
      return Promise.resolve(preferences);
    },
  });
};

setupIpc();
