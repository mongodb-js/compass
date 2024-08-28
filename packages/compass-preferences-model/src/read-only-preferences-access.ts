import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { Preferences, type PreferencesAccess } from './preferences';
import type { UserPreferences } from './preferences-schema';
import { type AllPreferences } from './preferences-schema';
import { InMemoryStorage } from './preferences-in-memory-storage';
import { getActiveUser } from './utils';

export class ReadOnlyPreferenceAccess implements PreferencesAccess {
  private _preferences: Preferences;
  constructor(preferencesOverrides?: Partial<AllPreferences>) {
    this._preferences = new Preferences({
      logger: createNoopLogger(),
      preferencesStorage: new InMemoryStorage(preferencesOverrides),
    });
  }

  // Not used, but we extend this interface elsewhere so need to provide those
  // for types
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  savePreferences(_attributes: Partial<UserPreferences>) {
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

  // Not used, but we extend this interface elsewhere so need to provide those
  // for types
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPreferenceValueChanged(_key: any, _cb: (value: any) => void) {
    return () => {
      // noop
    };
  }

  createSandbox() {
    return Promise.resolve(new ReadOnlyPreferenceAccess(this.getPreferences()));
  }

  getPreferencesUser() {
    return getActiveUser(this);
  }
}
