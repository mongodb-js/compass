import { createContext, useContext } from 'react';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { Preferences, type PreferencesAccess } from './preferences';
import { type AllPreferences } from './preferences-schema';
import { InMemoryStorage } from './storage';
export { usePreference, withPreferences } from './react';
export { capMaxTimeMSAtPreferenceLimit } from './maxtimems';
``;
export class ReadOnlyPreferenceAccess implements PreferencesAccess {
  private _preferences: Preferences;
  constructor(preferencesOverrides?: Partial<AllPreferences>) {
    this._preferences = new Preferences({
      logger: createNoopLoggerAndTelemetry(),
      preferencesStorage: new InMemoryStorage(preferencesOverrides),
    });
  }

  savePreferences() {
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

  onPreferenceValueChanged() {
    return () => {
      // noop
    };
  }

  createSandbox() {
    return Promise.resolve(new ReadOnlyPreferenceAccess(this.getPreferences()));
  }
}

const PreferencesContext = createContext<PreferencesAccess>(
  // Our context starts with our read-only preference access but we expect
  // different runtimes to provide their own access implementation at render.
  new ReadOnlyPreferenceAccess()
);

export const PreferencesProvider = PreferencesContext.Provider;

export function preferencesLocator(): PreferencesAccess {
  return useContext(PreferencesContext);
}
export type { PreferencesAccess };
