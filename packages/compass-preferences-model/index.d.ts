import AmpersandModel from 'ampersand-model';

export type CompassPreferencesModel = typeof AmpersandModel;

export = CompassPreferencesModel;

export async function loadGlobalConfig(){};
export async function parseCliArgs(){};

export enum THEMES {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  OS_THEME = 'OS_THEME'
};
