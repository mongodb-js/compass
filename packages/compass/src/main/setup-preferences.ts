import Preferences from 'compass-preferences-model';
import { ipcMain } from 'hadron-ipc';

const setupPreferences = async() => {
  const preferences = new Preferences();

  await preferences.fetchPreferences();

  ipcMain.handle('compass:save-preferences', async (event, attributes) => {
    const savedPreferencesValues = await preferences.savePreferences(attributes);
    ipcMain.broadcast('compass:preferences-changed', savedPreferencesValues);
    return savedPreferencesValues;
  });

  ipcMain.handle('compass:get-all-preferences', () => {
    return preferences.getAllPreferences();
  });

  ipcMain.handle('compass:get-configurable-user-preferences', () => {
    return preferences.getConfigurableUserPreferences();
  });
};

export { setupPreferences };
