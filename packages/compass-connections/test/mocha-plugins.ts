import type { GlobalPreferences } from 'compass-preferences-model';

// setupIpc();
let preferences = {};
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('hadron-ipc').ipcRenderer = {
  invoke: (name: string, attributes?: GlobalPreferences) => {
    if (name === 'compass:save-preferences') {
      preferences = { ...preferences, ...attributes };
    } else if (name === 'test:clear-preferences') {
      preferences = {};
    }
    return Promise.resolve(preferences);
  },
};
