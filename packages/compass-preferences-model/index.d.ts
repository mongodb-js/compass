declare class CompassPreferencesModel {
  fetch: () => void;
  save: () => void;
  set: (
    key: string,
    value: unknown
  ) => void;
};
export default CompassPreferencesModel;

export async function loadGlobalConfig(){};
export async function parseCliArgs(){};

export enum THEMES {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  OS_THEME = 'OS_THEME'
};
