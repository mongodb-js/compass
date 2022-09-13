import Preferences from 'compass-preferences-model';
import { ipcMain } from 'hadron-ipc';
import { pickBy } from 'lodash';

import { getStoragePaths } from '@mongodb-js/compass-utils';
const { basepath } = getStoragePaths() || {};

const setupPreferences = async() => {
  const preferences = new Preferences(basepath);

  await preferences.fetchPreferences();

  ipcMain.handle('compass:save-preferences', async (event, attributes) => {
    const savedPreferencesValues = await preferences.savePreferences(attributes);
    const changedPreferencesValues = pickBy(
      savedPreferencesValues,
      (value: string | boolean, key: string) => Object.keys(attributes).includes(key)
    );
    ipcMain.broadcast('compass:preferences-changed', changedPreferencesValues);
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
