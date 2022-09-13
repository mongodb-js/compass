import Preferences from 'compass-preferences-model';
import type { GlobalPreferences } from 'compass-preferences-model';
import { ipcMain } from 'hadron-ipc';

import { getStoragePaths } from '@mongodb-js/compass-utils';
const { basepath } = getStoragePaths() || {};

const setupPreferences = async() => {
  const preferences = new Preferences(basepath);

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

  ipcMain.handle('compass:get-configurable-user-preferences', () => {
    return preferences.getConfigurableUserPreferences();
  });
};

export { setupPreferences };
