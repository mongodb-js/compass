import {
  type UserDataEnvironment,
  type z,
  UserData,
} from '@mongodb-js/compass-user-data';
import { createLogger } from '@mongodb-js/compass-logging';
import {
  getDefaultsForStoredPreferences,
  getPreferencesValidator,
  listEncryptedStoredPreferences,
} from './preferences-schema';
import type {
  AllPreferences,
  StoredPreferences,
  StoredPreferencesValidator,
} from './preferences-schema';
import type { PreferencesStorage } from './preferences-storage';

const { log, mongoLogId } = createLogger('COMPASS-PREFERENCES');

/** Encrypts the secret parts of preferences before they are stored */
export type PreferencesSecretsCodec = {
  encrypt(plainText: string): string;
  decrypt(encrypted: string): string;
};

export type UserDataPreferencesStorageOptions = {
  /**
   * Without it secrets are stored as they are, which is right where the
   * storage encrypts them itself (the Atlas user-data service does)
   */
  secrets?: PreferencesSecretsCodec;
  overrides?: Partial<AllPreferences>;
};

type StoredInput = z.input<StoredPreferencesValidator>;

/**
 * Stored preferences in either environment. Preferences that cannot be read
 * are replaced by the defaults (see `loadError`), and the next change
 * overwrites what is stored, so a broken document never locks the user out.
 */
export class UserDataPreferencesStorage implements PreferencesStorage {
  private readonly defaultPreferences = getDefaultsForStoredPreferences();
  private readonly userData: UserData<
    StoredPreferencesValidator,
    'AppPreferences'
  >;
  private readonly secrets?: PreferencesSecretsCodec;
  private readonly overrides: Partial<AllPreferences>;
  private preferences: StoredPreferences = getDefaultsForStoredPreferences();
  loadError?: Error;

  constructor(
    env: UserDataEnvironment<'AppPreferences'>,
    { secrets, overrides = {} }: UserDataPreferencesStorageOptions = {}
  ) {
    this.userData = new UserData(
      getPreferencesValidator(),
      'AppPreferences',
      env
    );
    this.secrets = secrets;
    this.overrides = overrides;
  }

  async setup() {
    try {
      this.preferences =
        (await this.readPreferences()) ?? this.defaultPreferences;
      this.loadError = undefined;
    } catch (error) {
      this.loadError = error as Error;
      log.error(
        mongoLogId(1_001_000_456),
        'Preferences',
        'Failed to load stored preferences, using the defaults',
        { error: this.loadError.message }
      );
    }
  }

  private encryptSecrets(preferences: StoredInput): StoredInput {
    const { secrets } = this;
    if (!secrets) return preferences;
    const copy = { ...preferences } as Record<string, unknown>;
    for (const [key, { extract }] of listEncryptedStoredPreferences()) {
      if (copy[key]) {
        // The PreferenceDefinition typing ensures that only string properties can be encrypted
        const extracted = extract(copy[key] as string);
        copy[key] = JSON.stringify({
          remainder: extracted.remainder,
          secrets: secrets.encrypt(extracted.secrets),
        });
      }
    }
    return copy as StoredInput;
  }

  private decryptSecrets(preferences: StoredPreferences): StoredPreferences {
    const { secrets } = this;
    if (!secrets) return preferences;
    const copy = { ...preferences } as Record<string, unknown>;
    for (const [key, { merge }] of listEncryptedStoredPreferences()) {
      if (!copy[key]) continue;
      try {
        const stored = JSON.parse(copy[key] as string);
        copy[key] = merge({
          remainder: stored.remainder,
          secrets: secrets.decrypt(stored.secrets),
        });
      } catch (error) {
        // Only this preference is lost, rather than all of them
        delete copy[key];
        log.error(
          mongoLogId(1_001_000_457),
          'Preferences',
          'Failed to decrypt a stored preference',
          { key, error: (error as Error).message }
        );
      }
    }
    return copy as StoredPreferences;
  }

  private async readPreferences(): Promise<StoredPreferences | undefined> {
    const stored = await this.userData.readOne({ ignoreErrors: false });
    return stored && this.decryptSecrets(stored);
  }

  getPreferences(): StoredPreferences {
    return {
      ...this.defaultPreferences,
      ...this.preferences,
      ...this.overrides,
    };
  }

  async updatePreferences(attributes: Partial<StoredInput>) {
    // Read again so changes saved elsewhere since setup are kept; what cannot
    // be read is overwritten
    const current =
      (await this.readPreferences().catch(() => undefined)) ?? this.preferences;
    const updated = { ...current, ...attributes };
    if (!(await this.userData.write(this.encryptSecrets(updated)))) {
      throw new Error('Failed to save preferences');
    }
    this.preferences = (await this.readPreferences()) ?? this.preferences;
    this.loadError = undefined;
  }
}
