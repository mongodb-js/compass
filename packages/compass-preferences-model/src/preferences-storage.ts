import type { StoredPreferences } from './preferences-schema';

export interface PreferencesStorage {
  setup(): Promise<void>;
  /** Why the stored preferences could not be loaded, when they could not */
  loadError?: Error;
  getPreferences(): StoredPreferences;
  updatePreferences(attributes: Partial<StoredPreferences>): Promise<void>;
}
