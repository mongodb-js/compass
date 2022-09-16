import Preferences from './preferences';

export default Preferences;
export { THEMES, getSettingDescription } from './preferences';
export type {
  UserPreferences,
  UserConfigurablePreferences,
  PreferenceStateInformation,
  GlobalPreferences,
} from './preferences';
export { preferencesIpc } from './renderer-ipc';
export {
  parseAndValidateGlobalPreferences,
  getHelpText,
} from './global-config';
export type { ParsedGlobalPreferencesResult } from './global-config';
