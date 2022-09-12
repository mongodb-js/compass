import { preferencesIpc } from '.';

export enum THEMES {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  OS_THEME = 'OS_THEME'
}

export type UserPreferences = {
  showedNetworkOptIn: boolean; // Has the settings dialog has been shown before.
  autoUpdates: boolean;
  enableMaps: boolean;
  trackErrors: boolean;
  trackUsageStatistics: boolean;
  enableFeedbackPanel: boolean;
  theme: THEMES;
}

declare class Preferences {
  constructor(basepath?: string): void;
  fetchPreferences(): Promise<any>;
  savePreferences(attributes: any): Promise<void>;
  getAllPreferences(): Promise<any>;
  getConfigurableUserPreferences(): Promise<UserPreferences>;
}

export { preferencesIpc };

export default Preferences;
