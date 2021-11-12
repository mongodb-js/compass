import AmpersandModel from 'ampersand-model';

export type CompassPreferencesModel = typeof AmpersandModel;

export = CompassPreferencesModel;

export enum THEMES {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  OS_THEME = 'OS_THEME'
};
