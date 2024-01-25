export type { THEMES } from './preferences-schema';

import type {
  UserPreferences,
  UserConfigurablePreferences,
  PreferenceStateInformation,
  AllPreferences,
} from './preferences-schema';
import type { Preferences, PreferencesAccess } from './preferences';

export type {
  UserPreferences,
  UserConfigurablePreferences,
  PreferenceStateInformation,
  AllPreferences,
  Preferences,
};
import { preferencesMain, setupPreferences } from './setup-preferences';
import { preferencesIpc } from './renderer-ipc';
export {
  parseAndValidateGlobalPreferences,
  getHelpText,
  getExampleConfigFile,
} from './global-config';
export type { ParsedGlobalPreferencesResult } from './global-config';
export { getActiveUser, isAIFeatureEnabled } from './utils';
export { setupPreferencesAndUser } from './compass-utils';
export type { User, UserStorage } from './storage';
export type { PreferencesAccess };
export { setupPreferences };
export const defaultPreferencesInstance: PreferencesAccess =
  preferencesIpc ?? preferencesMain;
export function createSandboxFromDefaultPreferences(): Promise<PreferencesAccess> {
  return defaultPreferencesInstance.createSandbox();
}
