export enum THEMES {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  OS_THEME = 'OS_THEME'
};

export type UserPreferences = {
  showedNetworkOptIn: boolean; // Has the settings dialog has been shown before.
  autoUpdates: boolean;
  enableMaps: boolean;
  trackErrors: boolean;
  trackUsageStatistics: boolean;
  enableFeedbackPanel: boolean;
  theme: THEMES;
};

declare class CompassPreferencesModel {
  fetchPreferences: () => Promise<void>;
  savePreferences: (preferences: any) => Promise<void>;
  getPreferenceValue: any;
  onPreferenceChanged: (preferenceName: string, callback: () => void) => void;
  getConfigurableUserPreferences: () => UserPreferences;
};

export default CompassPreferencesModel;

// Export an instance of the class indirectly.
const preferences = new CompassPreferencesModel();
export { preferences };
