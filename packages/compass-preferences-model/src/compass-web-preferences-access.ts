import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { Preferences, type PreferencesAccess } from './preferences';
import type { UserPreferences } from './preferences-schema';
import { type AllPreferences } from './preferences-schema';
import { InMemoryStorage } from './preferences-in-memory-storage';
import { getActiveUser } from './utils';

export class CompassWebPreferencesAccess implements PreferencesAccess {
  private _preferences: Preferences;
  constructor(preferencesOverrides?: Partial<AllPreferences>) {
    this._preferences = new Preferences({
      logger: createNoopLogger(),
      preferencesStorage: new InMemoryStorage(preferencesOverrides),
    });
  }

  savePreferences(_attributes: Partial<UserPreferences>) {
    // Only allow saving the optInDataExplorerGenAIFeatures preference.
    if (
      Object.keys(_attributes).length === 1 &&
      'optInDataExplorerGenAIFeatures' in _attributes
    ) {
      return Promise.resolve(this._preferences.savePreferences(_attributes));
    }
    return Promise.resolve(this._preferences.getPreferences());
  }

  refreshPreferences() {
    return Promise.resolve(this._preferences.getPreferences());
  }

  getPreferences() {
    return this._preferences.getPreferences();
  }

  ensureDefaultConfigurableUserPreferences() {
    return this._preferences.ensureDefaultConfigurableUserPreferences();
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
    return (
      this._preferences?.onPreferencesChanged?.(
        (preferences: Partial<AllPreferences>) => {
          if (Object.keys(preferences).includes(preferenceName)) {
            return callback((preferences as AllPreferences)[preferenceName]);
          }
        }
      ) ??
      (() => {
        /* no fallback */
      })
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
