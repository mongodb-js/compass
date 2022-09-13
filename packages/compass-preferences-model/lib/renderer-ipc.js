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
  onPreferencesChanged(preferenceName, callback) {
    const listener = (_, preferences) => {
      if (Object.keys(preferences).includes(preferenceName)) {
        return callback(preferences[preferenceName]);
      }
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
