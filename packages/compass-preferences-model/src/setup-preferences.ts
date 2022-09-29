import { Preferences } from './preferences';
import hadronIpc from 'hadron-ipc';
import type {
  AllPreferences,
  PreferenceStateInformation,
  UserConfigurablePreferences,
  UserPreferences,
} from './preferences';
import type { ParsedGlobalPreferencesResult } from './global-config';

import { getStoragePaths } from '@mongodb-js/compass-utils';
import type { PreferencesAccess } from '.';
const { basepath } = getStoragePaths() || {};

let preferencesSingleton: Preferences | undefined;

export async function setupPreferences(
  globalPreferences: ParsedGlobalPreferencesResult
): Promise<void> {
  if (preferencesSingleton) {
    throw new Error('Preferences setup already been called!');
  }

  const preferences = (preferencesSingleton = new Preferences(
    basepath,
    globalPreferences
  ));

  await preferences.fetchPreferences();

  const { ipcMain } = hadronIpc;
  preferences.onPreferencesChanged(
    (changedPreferencesValues: Partial<AllPreferences>) => {
      ipcMain.broadcast(
        'compass:preferences-changed',
        changedPreferencesValues
      );
    }
  );

  ipcMain.handle(
    'compass:save-preferences',
    (event: Event, attributes: Partial<AllPreferences>) => {
      return preferences.savePreferences(attributes);
    }
  );

  ipcMain.handle('compass:get-preferences', () => {
    return preferences.getPreferences();
  });

  ipcMain.handle('compass:get-preference-states', () => {
    return preferences.getPreferenceStates();
  });

  ipcMain.handle('compass:get-configurable-user-preferences', () => {
    return preferences.getConfigurableUserPreferences();
  });
}

export const preferencesMain: PreferencesAccess = {
  async savePreferences(
    attributes: Partial<UserPreferences>
  ): Promise<AllPreferences> {
    return (
      preferencesSingleton?.savePreferences?.(attributes) ??
      ({} as AllPreferences)
    );
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  async refreshPreferences(): Promise<AllPreferences> {
    return preferencesSingleton?.getPreferences?.() ?? ({} as AllPreferences);
  },
  getPreferences(): AllPreferences {
    return preferencesSingleton?.getPreferences?.() ?? ({} as AllPreferences);
  },
  async getConfigurableUserPreferences(): Promise<UserConfigurablePreferences> {
    return (
      preferencesSingleton?.getConfigurableUserPreferences?.() ??
      ({} as UserConfigurablePreferences)
    );
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  async getPreferenceStates(): Promise<PreferenceStateInformation> {
    return preferencesSingleton?.getPreferenceStates() ?? {};
  },
  onPreferenceValueChanged<K extends keyof AllPreferences>(
    preferenceName: K,
    callback: (value: AllPreferences[K]) => void
  ): () => void {
    return (
      preferencesSingleton?.onPreferencesChanged?.(
        (preferences: Partial<AllPreferences>) => {
          if (Object.keys(preferences).includes(preferenceName)) {
            return callback((preferences as AllPreferences)[preferenceName]);
          }
        }
      ) ??
      (() => {
        /* no fallback */
      })
    );
  },
};
