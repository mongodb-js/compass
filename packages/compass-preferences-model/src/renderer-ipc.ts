import type { HadronIpcRenderer } from 'hadron-ipc';
import hadronIpc from 'hadron-ipc';
import type { PreferencesAccess } from '.';
import type {
  AllPreferences,
  PreferenceSandboxProperties,
  PreferenceStateInformation,
  UserConfigurablePreferences,
  UserPreferences,
} from './preferences';
import { createSandboxAccessFromProps } from './setup-preferences';

/**
 * API to communicate with preferences from the electron renderer process.
 */
export const makePreferencesIpc = (ipcRenderer: HadronIpcRenderer) => {
  const cachedPreferences = {} as AllPreferences;
  async function refreshCachedPreferences(): Promise<AllPreferences> {
    const result: AllPreferences = await ipcRenderer.invoke(
      'compass:get-preferences'
    );
    Object.assign(cachedPreferences, result);
    return result;
  }
  void refreshCachedPreferences();
  ipcRenderer.on(
    'compass:preferences-changed',
    () =>
      void refreshCachedPreferences().catch(() => {
        /* ignore */
      })
  );

  return {
    async savePreferences(
      attributes: Partial<UserPreferences>
    ): Promise<AllPreferences> {
      await ipcRenderer.invoke('compass:save-preferences', attributes);
      return await refreshCachedPreferences();
    },
    refreshPreferences(): Promise<AllPreferences> {
      return refreshCachedPreferences();
    },
    getPreferences(): AllPreferences {
      return { ...cachedPreferences };
    },
    ensureDefaultConfigurableUserPreferences(): Promise<void> {
      return ipcRenderer.invoke(
        'compass:ensure-default-configurable-user-preferences'
      );
    },
    getConfigurableUserPreferences(): Promise<UserConfigurablePreferences> {
      return ipcRenderer.invoke('compass:get-configurable-user-preferences');
    },
    getPreferenceStates(): Promise<PreferenceStateInformation> {
      return ipcRenderer.invoke('compass:get-preference-states');
    },
    onPreferenceValueChanged<K extends keyof AllPreferences>(
      preferenceName: K,
      callback: (value: AllPreferences[K]) => void
    ): () => void {
      const listener = (_: Event, preferences: AllPreferences) => {
        if (Object.keys(preferences).includes(preferenceName)) {
          return callback(preferences[preferenceName]);
        }
      };
      ipcRenderer.on('compass:preferences-changed', listener);
      return () => {
        ipcRenderer.removeListener('compass:preferences-changed', listener);
      };
    },
    async createSandbox(): Promise<PreferencesAccess> {
      const props: PreferenceSandboxProperties | undefined =
        await ipcRenderer.invoke('compass:get-preference-sandbox-properties');
      return createSandboxAccessFromProps(props);
    },
  };
};

export const preferencesIpc: PreferencesAccess | undefined =
  hadronIpc.ipcRenderer ? makePreferencesIpc(hadronIpc.ipcRenderer) : undefined;
