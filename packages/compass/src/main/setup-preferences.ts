import Preferences from 'compass-preferences-model';
import { ipcMain } from 'hadron-ipc';

import { getStoragePaths } from '@mongodb-js/compass-utils';
const { basepath } = getStoragePaths() || {};

const setupPreferences = async() => {
  const preferences = new Preferences(basepath);

  await preferences.fetchPreferences();

  ipcMain.handle('compass:save-preferences', async (event, attributes) => {
    const savedPreferencesValues = await preferences.savePreferences(attributes);
    ipcMain.broadcast('compass:preferences-changed', savedPreferencesValues);
    return savedPreferencesValues;
  });

  ipcMain.handle('compass:get-preferences', () => {
    return preferences.getPreferences();
  });

  ipcMain.handle('compass:get-configurable-user-preferences', () => {
    return preferences.getConfigurableUserPreferences();
  });
};

export { setupPreferences };
