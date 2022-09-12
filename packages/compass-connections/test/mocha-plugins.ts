/* eslint-disable @typescript-eslint/no-var-requires */
import type { GlobalPreferences } from 'compass-preferences-model';

// setupIpc();
let savedPreferences = {};
if (!require('hadron-ipc').ipcRenderer) {
  require('hadron-ipc').ipcRenderer = {
    invoke: (name: string, preferences?: GlobalPreferences) => {
      if (name === 'compass:save-preferences') {
        savedPreferences = { ...savedPreferences, ...preferences };
      } else if (name === 'test:clear-preferences') {
        savedPreferences = {};
      }
      return Promise.resolve(savedPreferences);
    },
  };
}
