export type { THEMES } from './preferences';
export { getSettingDescription } from './preferences';
export { featureFlags } from './feature-flags';

import type {
  UserPreferences,
  UserConfigurablePreferences,
  PreferenceStateInformation,
  AllPreferences,
  Preferences,
} from './preferences';
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
export {
  capMaxTimeMSAtPreferenceLimit,
  setupPreferencesAndUser,
  getActiveUser,
  useIsAIFeatureEnabled,
  isAIFeatureEnabled,
} from './utils';
export type { User } from './storage';

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
export const preferencesAccess: PreferencesAccess =
  preferencesIpc ?? preferencesMain;
export default preferencesAccess;
