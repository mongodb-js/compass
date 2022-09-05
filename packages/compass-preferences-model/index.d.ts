declare class CompassPreferencesModel {
  fetch: () => void;
  save: () => void;
  set: (
    key: string,
    value: unknown
  ) => void;
};
export default CompassPreferencesModel;

export enum THEMES {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  OS_THEME = 'OS_THEME'
};
