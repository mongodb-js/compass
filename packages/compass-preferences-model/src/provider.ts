import { createContext, useContext } from 'react';
import type { PreferencesAccess } from './';
import { defaultPreferencesInstance } from '.';
export { usePreference, withPreferences } from './react';
export { capMaxTimeMSAtPreferenceLimit } from './maxtimems';

const PreferencesContext = createContext<PreferencesAccess>(
  // should be `defaultPreferencesInstance`, only using undefined here
  // to avoid the circular dependency with index.ts
  undefined as unknown as PreferencesAccess
);

export const PreferencesProvider = PreferencesContext.Provider;

export function preferencesLocator(): PreferencesAccess {
  return useContext(PreferencesContext) ?? defaultPreferencesInstance;
}
export type { PreferencesAccess };
