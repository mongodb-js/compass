import type { HadronIpcRenderer } from 'hadron-ipc';
import { ipcRenderer } from 'hadron-ipc';
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
export const makePreferencesIpc = (
  ipcRenderer: HadronIpcRenderer | undefined
) => {
  if (!ipcRenderer) {
    throw new Error('IPC not available');
  }

  let cachedPreferences = {} as AllPreferences;
  let inflightCacheRefresh: Promise<AllPreferences> | undefined;
  async function refreshCachedPreferences(): Promise<AllPreferences> {
    inflightCacheRefresh = ipcRenderer!.invoke('compass:get-preferences');
    cachedPreferences = await inflightCacheRefresh;
    inflightCacheRefresh = undefined;
    return cachedPreferences;
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
      let isUnsubscribed = false;
      const listener = (_: unknown, changedPreferences: AllPreferences) => {
        // Ensure that .getPreferences() calls return the right value inside the callback.
        Object.assign(cachedPreferences, changedPreferences);
        if (Object.keys(changedPreferences).includes(preferenceName)) {
          return callback(changedPreferences[preferenceName]);
        }
      };

      // Account for the possibility that we are currently refreshing
      // preferences, which may update the value of this preference in the
      // renderer cache, but not result in a call to
      // compass:preferences-changed (because that call was the one which
      // triggered the refresh).
      void inflightCacheRefresh?.then((preferences) => {
        if (!isUnsubscribed) listener({}, preferences);
      });

      ipcRenderer.on('compass:preferences-changed', listener);
      return () => {
        isUnsubscribed = true;
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

export const preferencesIpc: PreferencesAccess | undefined = ipcRenderer
  ? makePreferencesIpc(ipcRenderer)
  : undefined;
