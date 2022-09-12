const ipc = require('hadron-ipc');

/**
 * API to communicate with preferences from the electron renderer process.
 */
const preferencesIpc = {
  savePreferences(attributes) {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:save-preferences', attributes);
    }
  },
  getPreferences() {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:get-preferences');
    }
  },
  getConfigurableUserPreferences() {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:get-configurable-user-preferences');
    }
  },
  onPreferencesChanged(callback) {
    if (typeof ipc?.ipcRenderer?.on === 'function') {
      ipc.ipcRenderer.on('compass:preferences-changed', (_, preferences) => {
        callback(preferences);
      });
    }
  }
};

module.exports.preferencesIpc = preferencesIpc;
