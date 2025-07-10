import { type z, FileUserData } from '@mongodb-js/compass-user-data';
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
  private readonly file = 'General';
  private readonly defaultPreferences = getDefaultsForStoredPreferences();
  private readonly userData: FileUserData<StoredPreferencesValidator>;
  private preferences: StoredPreferences = getDefaultsForStoredPreferences();
  private safeStorage?: PreferencesSafeStorage;

  constructor(basePath?: string, safeStorage?: PreferencesSafeStorage) {
    this.userData = new FileUserData(getPreferencesValidator(), {
      subdir: 'AppPreferences',
      basePath,
    });
    this.safeStorage = safeStorage;
  }

  async setup() {
    try {
      this.preferences = await this.readPreferences();
    } catch (e) {
      if (
        (e as any).code === 'ENOENT' || // First time user
        e instanceof SyntaxError // Invalid json
      ) {
        // Create the file for the first time
        await this.writePreferences(this.defaultPreferences);
        return;
      }
      throw e;
    }
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
    await this.userData.write(this.file, copy);
  }

  private async readPreferences(): Promise<StoredPreferences> {
    const copy = await this.userData.readOne(this.file, {
      ignoreErrors: false,
    });
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
      ...(await this.readPreferences()),
      ...attributes,
    });

    this.preferences = await this.readPreferences();
  }
}
