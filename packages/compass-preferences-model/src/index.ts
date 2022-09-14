import Preferences from './preferences';

export default Preferences;
export { THEMES } from './preferences';
export type {
  UserPreferences,
  UserConfigurablePreferences,
  GlobalPreferences,
} from './preferences';
export { preferencesIpc } from './renderer-ipc';
