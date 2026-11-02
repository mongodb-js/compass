import { type z, UserData } from '@mongodb-js/compass-user-data';
import { createLocalUserDataFetch } from '@mongodb-js/compass-user-data/local';
import {
  getDefaultsForStoredPreferences,
  getPreferencesValidator,
  listEncryptedStoredPreferences,
} from './preferences-schema';
import type {
  StoredPreferences,
  StoredPreferencesValidator,
} from './preferences-schema';

import type { PreferencesStorage } from './preferences-storage';

export type PreferencesSafeStorage = {
  // ~ partial Electron.SafeStorage
  decryptString(encrypted: Buffer): string;
  encryptString(plainText: string): Buffer;
};

export class PersistentStorage implements PreferencesStorage {
  private readonly defaultPreferences = getDefaultsForStoredPreferences();
  private readonly userData: UserData<
    StoredPreferencesValidator,
    'AppPreferences'
  >;
  private preferences: StoredPreferences = getDefaultsForStoredPreferences();
  private safeStorage?: PreferencesSafeStorage;

  constructor(basePath?: string, safeStorage?: PreferencesSafeStorage) {
    this.userData = new UserData(getPreferencesValidator(), 'AppPreferences', {
      kind: 'local',
      fetch: createLocalUserDataFetch({ basePath }),
    });
    this.safeStorage = safeStorage;
  }

  async setup() {
    try {
      const preferences = await this.readPreferences();
      if (preferences) {
        this.preferences = preferences;
        return;
      }
    } catch (e) {
      if (!(e instanceof SyntaxError)) {
        throw e;
      }
    }
    // First time user, or the stored preferences are not valid JSON
    await this.writePreferences(this.defaultPreferences);
  }

  private async writePreferences(
    preferences: z.input<StoredPreferencesValidator>
  ): Promise<void> {
    const copy = { ...preferences };
    for (const [key, { extract }] of listEncryptedStoredPreferences()) {
      if (copy[key]) {
        // The PreferenceDefinition typing ensures that only string properties can be encrypted
        const { remainder, secrets } = extract(copy[key] as string);
        (copy as any)[key] = JSON.stringify({
          remainder,
          secrets: this.getSafeStorage()
            .encryptString(secrets)
            .toString('base64'),
        });
      }
    }
    await this.userData.write(copy);
  }

  private async readPreferences(): Promise<StoredPreferences | undefined> {
    const copy = await this.userData.readOne({ ignoreErrors: false });
    if (!copy) {
      return undefined;
    }
    for (const [key, { merge }] of listEncryptedStoredPreferences()) {
      if (copy[key]) {
        const { remainder, secrets } = JSON.parse(copy[key] as string);
        (copy as any)[key] = merge({
          remainder,
          secrets: this.getSafeStorage().decryptString(
            Buffer.from(secrets, 'base64')
          ),
        });
      }
    }
    return copy;
  }

  private getSafeStorage(): PreferencesSafeStorage {
    if (!this.safeStorage) {
      throw new Error(
        'This instance of PersistentStorage has not been configured with a safeStorage provider'
      );
    }
    return this.safeStorage;
  }

  getPreferences(): StoredPreferences {
    return {
      ...this.defaultPreferences,
      ...this.preferences,
    };
  }

  async updatePreferences(
    attributes: Partial<z.input<StoredPreferencesValidator>>
  ) {
    await this.writePreferences({
      ...((await this.readPreferences()) ?? this.defaultPreferences),
      ...attributes,
    });

    this.preferences = (await this.readPreferences()) ?? this.preferences;
  }
}
