export type UserPreferences = {
  /**
   * Has the settings dialog has been shown before
   */
  showedNetworkOptIn: boolean;
  autoUpdates: boolean;
  enableMaps: boolean;
  trackErrors: boolean;
  trackUsageStatistics: boolean;
  enableFeedbackPanel: boolean;
  theme: THEMES.DARK | THEMES.LIGHT | THEMES.OS_THEME;
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

export enum THEMES {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  OS_THEME = 'OS_THEME'
};
