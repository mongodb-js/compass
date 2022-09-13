import ipc from 'hadron-ipc';
import type {
  GlobalPreferences,
  UserPreferences,
  OnPreferencesChangedCallback,
} from './preferences';

/**
 * API to communicate with preferences from the electron renderer process.
 */
export const preferencesIpc = {
  savePreferences(attributes: Partial<GlobalPreferences>) {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:save-preferences', attributes);
    }
    return {} as UserPreferences;
  },
  getPreferences() {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:get-preferences');
    }
    return {} as GlobalPreferences;
  },
  getConfigurableUserPreferences() {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke(
        'compass:get-configurable-user-preferences'
      );
    }
    return {} as UserPreferences;
  },
  onPreferenceValueChanged(
    preferenceName: string,
    callback: OnPreferencesChangedCallback
  ) {
    const listener = (_: Event, preferences: GlobalPreferences) => {
      if (Object.keys(preferences).includes(preferenceName)) {
        return callback((preferences as any)[preferenceName]);
      }
    };
    if (typeof ipc?.ipcRenderer?.on === 'function') {
      ipc.ipcRenderer.on('compass:preferences-changed', listener);
      return () => {
        ipc.ipcRenderer.removeListener('compass:preferences-changed', listener);
      };
    }
    return () => {
      /** Missing ipc fallback */
    };
  },
};
