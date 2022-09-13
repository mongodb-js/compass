import Preferences from './preferences';

export default Preferences;
export { THEMES } from './preferences';
export type {
  UserPreferences,
  GlobalPreferences,
  OnPreferenceValueChangedCallback,
  OnPreferencesChangedCallback,
} from './preferences';
export { preferencesIpc } from './renderer-ipc';
