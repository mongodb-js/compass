import type { z } from 'zod';
import { UserData } from '@mongodb-js/compass-user-data';
import {
  getDefaultsForStoredPreferences,
  getPreferencesValidator,
} from './preferences-schema';
import type {
  StoredPreferences,
  StoredPreferencesValidator,
} from './preferences-schema';

import type { PreferencesStorage } from './preferences-storage';

export class PersistentStorage implements PreferencesStorage {
  private readonly file = 'General';
  private readonly defaultPreferences = getDefaultsForStoredPreferences();
  private readonly userData: UserData<StoredPreferencesValidator>;
  private preferences: StoredPreferences = getDefaultsForStoredPreferences();

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
        await this.userData.write(this.file, this.defaultPreferences);
        return;
      }
      throw e;
    }
  }

  private async readPreferences(): Promise<StoredPreferences> {
    return await this.userData.readOne(this.file, {
      ignoreErrors: false,
    });
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
    await this.userData.write(this.file, {
      ...(await this.readPreferences()),
      ...attributes,
    });

    this.preferences = await this.readPreferences();
  }
}
