import Preferences from 'compass-preferences-model';
import type { GlobalPreferences , ParsedGlobalPreferencesResult } from 'compass-preferences-model';
import { ipcMain } from 'hadron-ipc';

import { getStoragePaths } from '@mongodb-js/compass-utils';
const { basepath } = getStoragePaths() || {};

const setupPreferences = async(globalPreferences: ParsedGlobalPreferencesResult) => {
  const preferences = new Preferences(basepath, globalPreferences);

  await preferences.fetchPreferences();

  preferences.onPreferencesChanged((changedPreferencesValues: Partial<GlobalPreferences>) => {
    ipcMain.broadcast('compass:preferences-changed', changedPreferencesValues);
  });

  ipcMain.handle('compass:save-preferences', (event: Event, attributes: Partial<GlobalPreferences>) => {
    return preferences.savePreferences(attributes);
  });

  ipcMain.handle('compass:get-preferences', () => {
    return preferences.getPreferences();
  });

  ipcMain.handle('compass:get-preference-states', () => {
    return preferences.getPreferenceStates();
  });

  ipcMain.handle('compass:ensure-default-configurable-user-preferences', () => {
    return preferences.ensureDefaultConfigurableUserPreferences();
  });

  ipcMain.handle('compass:get-configurable-user-preferences', () => {
    return preferences.getConfigurableUserPreferences();
  });

  return preferences;
};

export { setupPreferences };
