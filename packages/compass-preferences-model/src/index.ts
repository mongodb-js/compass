import type {
  UserPreferences,
  UserConfigurablePreferences,
  PreferenceStateInformation,
  AllPreferences,
} from './preferences-schema';
import type { Preferences, PreferencesAccess } from './preferences';
import { preferencesMain, setupPreferences } from './setup-preferences';
import { preferencesIpc } from './renderer-ipc';

export type { THEMES } from './preferences-schema';

export type {
  UserPreferences,
  UserConfigurablePreferences,
  PreferenceStateInformation,
  AllPreferences,
  Preferences,
};
export {
  parseAndValidateGlobalPreferences,
  getHelpText,
  getExampleConfigFile,
} from './global-config';
export type { ParsedGlobalPreferencesResult } from './global-config';
export {
  getActiveUser,
  isAIFeatureEnabled,
  proxyPreferenceToProxyOptions,
  proxyOptionsToProxyPreference,
} from './utils';
export { setupPreferencesAndUser } from './compass-utils';
export type { User, UserStorage } from './user-storage';
export type { PreferencesAccess };
export { setupPreferences };
export const defaultPreferencesInstance: PreferencesAccess =
  preferencesIpc ?? preferencesMain;
export function createSandboxFromDefaultPreferences(): Promise<PreferencesAccess> {
  return defaultPreferencesInstance.createSandbox();
}
export type { DevtoolsProxyOptions } from '@mongodb-js/devtools-proxy-support';
export type * from './feature-flags';
export type * from './preferences-schema';
