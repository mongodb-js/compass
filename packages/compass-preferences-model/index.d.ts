declare class ApmersandPreferencesModel {
  fetch: () => void;
  save: () => void;
  set: (
    key: string,
    value: unknown
  ) => void;
  getAttributes: (options: any) => any;
};

declare class CompassPreferencesModel {
  userPreferencesModel: ApmersandPreferencesModel;
  fetchPreferences: () => Promise<void>;
  savePreferences: (preferences: any) => Promise<void>;
  getPreferenceValue: any;
  onPreferenceChanged: (preferenceName: string, callback: () => void) => void;
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
