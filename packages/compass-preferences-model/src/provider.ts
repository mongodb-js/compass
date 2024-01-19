import { createContext, useContext } from 'react';
import type {
  AllPreferences,
  PreferenceStateInformation,
  PreferencesAccess,
  UserConfigurablePreferences,
} from './';
import { getInitialValuesForAllPreferences } from './preferences-schema';
export { usePreference, withPreferences } from './react';
export { capMaxTimeMSAtPreferenceLimit } from './maxtimems';

export class ReadOnlyPreferenceService implements PreferencesAccess {
  private allPreferences: AllPreferences;
  constructor(preferencesOverrides?: Partial<AllPreferences>) {
    this.allPreferences = {
      ...getInitialValuesForAllPreferences(),
      ...preferencesOverrides,
    };
  }

  savePreferences() {
    return Promise.resolve(this.allPreferences);
  }

  refreshPreferences() {
    return Promise.resolve(this.allPreferences);
  }

  getPreferences() {
    return this.allPreferences;
  }

  ensureDefaultConfigurableUserPreferences() {
    return Promise.resolve();
  }

  getConfigurableUserPreferences() {
    return Promise.resolve({} as UserConfigurablePreferences);
  }

  getPreferenceStates() {
    return Promise.resolve({} as PreferenceStateInformation);
  }

  onPreferenceValueChanged() {
    return () => {
      // noop
    };
  }

  createSandbox() {
    return Promise.reject('Method not supported');
  }
}

const PreferencesContext = createContext<PreferencesAccess>(
  // Our context starts with our simple preference service but we expect
  // different runtimes to provide their own service implementation at some
  // point.
  new ReadOnlyPreferenceService()
);

export const PreferencesProvider = PreferencesContext.Provider;

export function preferencesLocator(): PreferencesAccess {
  return useContext(PreferencesContext);
}
export type { PreferencesAccess };
