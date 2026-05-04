import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { Preferences, type PreferencesAccess } from './preferences';
import type {
  UserPreferences,
  AllPreferences,
  StoredPreferences,
} from './preferences-schema';
import type { AtlasCloudFeatureFlags } from './feature-flags';
import { InMemoryStorage } from './preferences-in-memory-storage';
import { getActiveUser } from './utils';
import type { ParsedGlobalPreferencesResult } from './global-config';

export class CompassWebPreferencesAccess implements PreferencesAccess {
  private _preferences: Preferences;
  constructor(
    preferencesOverrides?: Partial<AllPreferences>,
    globalPreferences?: Partial<ParsedGlobalPreferencesResult>
  ) {
    this._preferences = new Preferences({
      logger: createNoopLogger(),
      preferencesStorage: new InMemoryStorage(preferencesOverrides),
      globalPreferences,
    });
  }

  savePreferences(_attributes: Partial<UserPreferences>) {
    return this._preferences.savePreferences(_attributes);
  }

  refreshPreferences() {
    return Promise.resolve(this._preferences.getPreferences());
  }

  getPreferences() {
    return this._preferences.getPreferences();
  }

  syncEmbedderProvidedPreferences(
    userPreferenceOverrides: Partial<StoredPreferences>,
    atlasCloudFeatureFlags: Partial<AtlasCloudFeatureFlags> = {}
  ) {
    return this._preferences.syncEmbedderProvidedPreferences(
      userPreferenceOverrides,
      atlasCloudFeatureFlags
    );
  }

  getConfigurableUserPreferences() {
    return Promise.resolve(this._preferences.getConfigurableUserPreferences());
  }

  getPreferenceStates() {
    return Promise.resolve(this._preferences.getPreferenceStates());
  }

  onPreferenceValueChanged<K extends keyof AllPreferences>(
    preferenceName: K,
    callback: (value: AllPreferences[K]) => void
  ) {
    return this._preferences.onPreferencesChanged(
      (preferences: Partial<AllPreferences>) => {
        if (Object.keys(preferences).includes(preferenceName)) {
          return callback((preferences as AllPreferences)[preferenceName]);
        }
      }
    );
  }

  createSandbox() {
    return Promise.resolve(
      new CompassWebPreferencesAccess(this.getPreferences())
    );
  }

  getPreferencesUser() {
    return getActiveUser(this);
  }
}
