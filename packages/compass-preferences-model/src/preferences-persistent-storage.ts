import type { z } from 'zod';
import { UserData } from '@mongodb-js/compass-user-data';
import {
  getDefaultsForStoredPreferences,
  getPreferencesValidator,
  listEncryptedStoredPreferences,
} from './preferences-schema';
import type {
  StoredPreferences,
  StoredPreferencesValidator,
} from './preferences-schema';
import { safeStorage } from 'electron';

import type { PreferencesStorage } from './preferences-storage';

export class PersistentStorage implements PreferencesStorage {
  private readonly file = 'General';
  private readonly defaultPreferences = getDefaultsForStoredPreferences();
  private readonly userData: UserData<StoredPreferencesValidator>;
  private preferences: StoredPreferences = getDefaultsForStoredPreferences();
  private safeStorage: Pick<
    Electron.SafeStorage,
    'decryptString' | 'encryptString'
  > = safeStorage;

  constructor(basePath?: string) {
    this.userData = new UserData(getPreferencesValidator(), {
      subdir: 'AppPreferences',
      basePath,
    });
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
          secrets: this.safeStorage.encryptString(secrets).toString('base64'),
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
          secrets: this.safeStorage.decryptString(
            Buffer.from(secrets, 'base64')
          ),
        });
      }
    }
    return copy;
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
