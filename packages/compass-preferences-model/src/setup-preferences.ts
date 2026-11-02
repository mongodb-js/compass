import { ipcMain } from '@mongodb-js/hadron-ipc';
import { createLogger } from '@mongodb-js/compass-logging';
import { createLocalUserDataFetch } from '@mongodb-js/compass-user-data/local';
import { Preferences } from './preferences';
import type {
  AllPreferences,
  PreferenceStateInformation,
  UserConfigurablePreferences,
  UserPreferences,
  CompassRunningEnvironment,
} from './preferences-schema';
import type { PreferenceSandboxProperties } from './preferences';
import type { ParsedGlobalPreferencesResult } from './global-config';

import type { PreferencesSecretsCodec } from './preferences-user-data-storage';
import { UserDataPreferencesStorage } from './preferences-user-data-storage';
import { InMemoryStorage } from './preferences-in-memory-storage';
import { getActiveUser, type PreferencesAccess } from '.';

const compassPreferencesLogger = createLogger('COMPASS-PREFERENCES');

export type PreferencesSafeStorage = {
  // ~ partial Electron.SafeStorage
  decryptString(encrypted: Buffer): string;
  encryptString(plainText: string): Buffer;
};

function safeStorageSecrets(
  safeStorage: PreferencesSafeStorage
): PreferencesSecretsCodec {
  return {
    encrypt: (plainText) =>
      safeStorage.encryptString(plainText).toString('base64'),
    decrypt: (encrypted) =>
      safeStorage.decryptString(Buffer.from(encrypted, 'base64')),
  };
}
let preferencesSingleton: Preferences | undefined;

export async function setupPreferences(
  globalPreferences: ParsedGlobalPreferencesResult,
  safeStorage: PreferencesSafeStorage,
  runningEnvironment: CompassRunningEnvironment = 'desktop'
): Promise<PreferencesAccess> {
  if (preferencesSingleton) {
    throw new Error('Preferences setup already been called!');
  }

  const preferencesStorage =
    process.env.COMPASS_TEST_USE_PREFERENCES_SANDBOX === 'true'
      ? new InMemoryStorage()
      : new UserDataPreferencesStorage(
          { kind: 'local', fetch: createLocalUserDataFetch() },
          { secrets: safeStorageSecrets(safeStorage) }
        );

  const preferences = (preferencesSingleton = new Preferences({
    logger: compassPreferencesLogger,
    globalPreferences,
    preferencesStorage,
    runningEnvironment,
  }));

  await preferences.setupStorage();

  if (!ipcMain) {
    // Ignore missing ipc if COMPASS_TEST_ env is set, this means that we are in
    // a test environment where it's expected not to have ipc
    if (process.env.COMPASS_TEST_USE_PREFERENCES_SANDBOX === 'true') {
      return preferencesMain;
    }
    throw new Error('Trying to setup preferences in unsupported environments');
  }

  preferences.onPreferencesChanged(
    (changedPreferencesValues: Partial<AllPreferences>) => {
      ipcMain?.broadcast(
        'compass:preferences-changed',
        changedPreferencesValues
      );
    }
  );

  ipcMain.handle(
    'compass:save-preferences',
    (event: unknown, attributes: Partial<AllPreferences>) => {
      return preferences.savePreferences(attributes);
    }
  );

  ipcMain.handle('compass:get-preferences', () => {
    return preferences.getPreferences();
  });

  ipcMain.handle('compass:get-preference-states', () => {
    return preferences.getPreferenceStates();
  });

  ipcMain.handle('compass:get-settings-ui-preferences', () => {
    return preferences.getSettingsUIPreferences();
  });

  ipcMain.handle('compass:get-preferences-load-error', () => {
    return preferences.getStorageLoadError();
  });

  ipcMain.handle('compass:get-preference-sandbox-properties', () => {
    return preferences.getPreferenceSandboxProperties();
  });
  return preferencesMain;
}

const makePreferenceMain = (
  preferences: () => Preferences | undefined
): PreferencesAccess => ({
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
  // eslint-disable-next-line @typescript-eslint/require-await
  async getSettingsUIPreferences(): Promise<
    Partial<UserConfigurablePreferences>
  > {
    return preferences()?.getSettingsUIPreferences?.() ?? {};
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
  // eslint-disable-next-line @typescript-eslint/require-await
  async getStorageLoadError(): Promise<string | undefined> {
    return preferences()?.getStorageLoadError();
  },
  getPreferencesUser() {
    const prefs = preferences();
    if (!prefs) {
      throw new Error('Can not get user');
    }
    return getActiveUser(prefs);
  },
});
export async function createSandboxAccessFromProps(
  props: PreferenceSandboxProperties | undefined
): Promise<PreferencesAccess> {
  const sandbox = await Preferences.CreateSandbox(
    props,
    compassPreferencesLogger
  );
  return makePreferenceMain(() => sandbox);
}
export const preferencesMain: PreferencesAccess = makePreferenceMain(
  () => preferencesSingleton
);
