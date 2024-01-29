import type { StoredPreferences } from './preferences-schema';

export interface PreferencesStorage {
  setup(): Promise<void>;
  getPreferences(): StoredPreferences;
  updatePreferences(attributes: Partial<StoredPreferences>): Promise<void>;
}
