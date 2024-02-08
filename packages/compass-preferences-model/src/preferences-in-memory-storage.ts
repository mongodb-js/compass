import type { PreferencesStorage } from './preferences-storage';
import { getDefaultsForStoredPreferences } from './preferences-schema';
import type { AllPreferences, StoredPreferences } from './preferences-schema';

export class InMemoryStorage implements PreferencesStorage {
  private preferences = getDefaultsForStoredPreferences();

  constructor(preferencesOverrides?: Partial<AllPreferences>) {
    this.preferences = {
      ...this.preferences,
      ...preferencesOverrides,
    };
  }

  getPreferences() {
    return this.preferences;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async updatePreferences(attributes: Partial<StoredPreferences>) {
    this.preferences = {
      ...this.preferences,
      ...attributes,
    };
  }

  async setup() {
    // noop
  }
}
