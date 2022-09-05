import {
  loadGlobalConfig,
  // parseCliArgs
} from 'compass-preferences-model';
import { ipcMain } from 'hadron-ipc';

const setupPreferences = async() => {
  const globalPreferences = await loadGlobalConfig();

  ipcMain.handle('compass:setup-preferences', () => {
    return {
      globalPreferences,
      cliPreferences: {},
      processArgs: process.argv
    };
  })
};

export { setupPreferences };
