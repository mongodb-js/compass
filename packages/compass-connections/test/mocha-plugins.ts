/* eslint-disable @typescript-eslint/no-var-requires */
// setupIpc();
let savedPreferences = {};
if (!require('hadron-ipc').ipcRenderer) {
  require('hadron-ipc').ipcRenderer = {
    invoke: (name: string, preferences?: any) => {
      if (name === 'compass:save-preferences') {
        savedPreferences = { ...savedPreferences, ...preferences };
      } else if (name === 'test:clear-preferences') {
        savedPreferences = {};
      }
      return Promise.resolve(savedPreferences);
    },
  };
}
