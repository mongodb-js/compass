export type { THEMES } from './preferences-schema';
export { getSettingDescription } from './preferences-schema';
export { featureFlags } from './feature-flags';

import type {
  UserPreferences,
  UserConfigurablePreferences,
  PreferenceStateInformation,
  AllPreferences,
} from './preferences-schema';
import type { Preferences } from './preferences';
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
export { usePreference, withPreferences } from './react';
export { capMaxTimeMSAtPreferenceLimit } from './maxtimems';
export {
  setupPreferencesAndUser,
  getActiveUser,
  useIsAIFeatureEnabled,
  isAIFeatureEnabled,
} from './utils';
export type { User, UserStorage } from './storage';

export interface PreferencesAccess {
  savePreferences(
    attributes: Partial<UserPreferences>
  ): Promise<AllPreferences>;
  refreshPreferences(): Promise<AllPreferences>;
  getPreferences(): AllPreferences;
  ensureDefaultConfigurableUserPreferences(): Promise<void>;
  getConfigurableUserPreferences(): Promise<UserConfigurablePreferences>;
  getPreferenceStates(): Promise<PreferenceStateInformation>;
  onPreferenceValueChanged<K extends keyof AllPreferences>(
    preferenceName: K,
    callback: (value: AllPreferences[K]) => void
  ): () => void;
  createSandbox(): Promise<PreferencesAccess>;
}
export { setupPreferences };
export const defaultPreferencesInstance: PreferencesAccess =
  preferencesIpc ?? preferencesMain;
export function createSandboxFromDefaultPreferences(): Promise<PreferencesAccess> {
  return defaultPreferencesInstance.createSandbox();
}
