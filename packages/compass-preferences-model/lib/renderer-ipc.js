const ipc = require('hadron-ipc');

/**
 * API to communicate with preferences from the electron renderer process.
 */
const preferencesIpc = {
  savePreferences(attributes) {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:save-preferences', attributes);
    }
    return {};
  },
  getPreferences() {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:get-preferences');
    }
    return {};
  },
  getConfigurableUserPreferences() {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:get-configurable-user-preferences');
    }
    return {};
  },
  onPreferencesChanged(callback) {
    const listener = (_, preferences) => {
      callback(preferences);
    };
    if (typeof ipc?.ipcRenderer?.on === 'function') {
      ipc.ipcRenderer.on('compass:preferences-changed', listener);
      return () => {
        ipc.ipcRenderer.removeListener('compass:preferences-changed', listener);
      };
    }
    return () => {};
  }
};

module.exports.preferencesIpc = preferencesIpc;
