import AmpersandModel from 'ampersand-model';

export type CompassPreferencesModel = typeof AmpersandModel;

export = CompassPreferencesModel;
// export const THEMES = {
//   DARK: 'DARK',
//   LIGHT: 'LIGHT',
//   OS_THEME: 'OS_THEME'
// };
// export type THEME_TYPE = THESE.DARK | THEMES.LIGHT | OS_THEME;


export enum THEMES {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  OS_THEME = 'OS_THEME'
};
