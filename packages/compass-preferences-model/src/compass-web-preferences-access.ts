import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { Preferences, type PreferencesAccess } from './preferences';
import type {
  AllPreferences,
  UserPreferences,
  CompassRunningEnvironment,
} from './preferences-schema';
import { InMemoryStorage } from './preferences-in-memory-storage';
import { getActiveUser } from './utils';
import type { ParsedGlobalPreferencesResult } from './global-config';

export class CompassWebPreferencesAccess implements PreferencesAccess {
  private _preferences: Preferences;
  constructor(
    preferencesOverrides?: Partial<AllPreferences>,
    globalPreferences?: Partial<ParsedGlobalPreferencesResult>,
    runningEnvironment: CompassRunningEnvironment = 'atlas'
  ) {
    this._preferences = new Preferences({
      logger: createNoopLogger(),
      preferencesStorage: new InMemoryStorage(preferencesOverrides),
      globalPreferences,
      runningEnvironment,
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

  getSettingsUIPreferences() {
    return Promise.resolve(this._preferences.getSettingsUIPreferences());
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
