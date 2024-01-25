import { getDefaultsForStoredPreferences } from './preferences-schema';
import type { AllPreferences, StoredPreferences } from './preferences-schema';

export interface BasePreferencesStorage {
  setup(): Promise<void>;
  getPreferences(): StoredPreferences;
  updatePreferences(attributes: Partial<StoredPreferences>): Promise<void>;
}

export class InMemoryStorage implements BasePreferencesStorage {
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
