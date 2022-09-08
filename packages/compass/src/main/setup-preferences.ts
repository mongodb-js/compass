import Preferences from 'compass-preferences-model';
import { ipcMain } from 'hadron-ipc';
import electron from 'electron';

const setupPreferences = async() => {
  const userDataPath = electron.app.getPath('userData');
  const preferences = new Preferences(userDataPath);

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
