import { Preferences } from './preferences';
import hadronIpc from 'hadron-ipc';
import type {
  AllPreferences,
  PreferenceStateInformation,
  UserConfigurablePreferences,
  UserPreferences,
  PreferenceSandboxProperties,
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

  ipcMain.handle('compass:ensure-default-configurable-user-preferences', () => {
    return preferences.ensureDefaultConfigurableUserPreferences();
  });

  ipcMain.handle('compass:get-configurable-user-preferences', () => {
    return preferences.getConfigurableUserPreferences();
  });

  ipcMain.handle('compass:get-preference-sandbox-properties', () => {
    return preferences.getPreferenceSandboxProperties();
  });
}

const makePreferenceMain = (preferences: () => Preferences | undefined) => ({
  async savePreferences(
    attributes: Partial<UserPreferences>
  ): Promise<AllPreferences> {
    return (
      preferences()?.savePreferences?.(attributes) ?? ({} as AllPreferences)
    );
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  async refreshPreferences(): Promise<AllPreferences> {
    return preferences()?.getPreferences?.() ?? ({} as AllPreferences);
  },
  getPreferences(): AllPreferences {
    return preferences()?.getPreferences?.() ?? ({} as AllPreferences);
  },
  async ensureDefaultConfigurableUserPreferences(): Promise<void> {
    return preferences()?.ensureDefaultConfigurableUserPreferences?.();
  },
  async getConfigurableUserPreferences(): Promise<UserConfigurablePreferences> {
    return (
      preferences()?.getConfigurableUserPreferences?.() ??
      ({} as UserConfigurablePreferences)
    );
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  async getPreferenceStates(): Promise<PreferenceStateInformation> {
    return preferences()?.getPreferenceStates() ?? {};
  },
  onPreferenceValueChanged<K extends keyof AllPreferences>(
    preferenceName: K,
    callback: (value: AllPreferences[K]) => void
  ): () => void {
    return (
      preferences()?.onPreferencesChanged?.(
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
  async createSandbox(): Promise<PreferencesAccess> {
    const props = await preferences()?.getPreferenceSandboxProperties();
    return createSandboxAccessFromProps(props);
  },
});
export async function createSandboxAccessFromProps(
  props: PreferenceSandboxProperties | undefined
): Promise<PreferencesAccess> {
  const sandbox = await Preferences.CreateSandbox(props);
  return makePreferenceMain(() => sandbox);
}
export const preferencesMain: PreferencesAccess = makePreferenceMain(
  () => preferencesSingleton
);
