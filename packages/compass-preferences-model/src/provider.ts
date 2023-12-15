import { createContext, useContext } from 'react';
import type { PreferencesAccess } from './';
import { defaultPreferencesInstance } from '.';
export { usePreference, withPreferences } from './react';

const PreferencesContext = createContext<PreferencesAccess>(
  defaultPreferencesInstance
);

export const PreferencesProvider = PreferencesContext.Provider;

export function preferencesLocator(): PreferencesAccess {
  return useContext(PreferencesContext);
}
export type { PreferencesAccess };
