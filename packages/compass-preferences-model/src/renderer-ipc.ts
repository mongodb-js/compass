import hadronIpc from 'hadron-ipc';
import type {
  GlobalPreferences,
  PreferenceStateInformation,
  UserConfigurablePreferences,
  UserPreferences,
} from './preferences';

/**
 * API to communicate with preferences from the electron renderer process.
 */
export const makePreferencesIpc = (ipc: typeof hadronIpc) => ({
  savePreferences(
    attributes: Partial<UserPreferences>
  ): Promise<GlobalPreferences> {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:save-preferences', attributes);
    }
    return Promise.resolve({} as GlobalPreferences);
  },
  getPreferences(): Promise<GlobalPreferences> {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:get-preferences');
    }
    return Promise.resolve({} as GlobalPreferences);
  },
  getConfigurableUserPreferences(): Promise<UserConfigurablePreferences> {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke(
        'compass:get-configurable-user-preferences'
      );
    }
    return Promise.resolve({} as UserConfigurablePreferences);
  },
  getPreferenceStates(): Promise<PreferenceStateInformation> {
    if (typeof ipc?.ipcRenderer?.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:get-preference-states');
    }
    return Promise.resolve({});
  },
  onPreferenceValueChanged<K extends keyof GlobalPreferences>(
    preferenceName: K,
    callback: (value: GlobalPreferences[K]) => void
  ): () => void {
    const listener = (_: Event, preferences: GlobalPreferences) => {
      if (Object.keys(preferences).includes(preferenceName)) {
        // TODO: find a proper type.
        return callback(preferences[preferenceName]);
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
});

export const preferencesIpc = makePreferencesIpc(hadronIpc);
