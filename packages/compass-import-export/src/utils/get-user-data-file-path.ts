import path from 'path';
import { getAppName, getStoragePath } from '@mongodb-js/compass-utils';

export function getUserDataFolderPath() {
  const appName = getAppName();
  const basepath = getStoragePath();
  if (appName === undefined || basepath === undefined) {
    throw new Error('cannot access user data folder path');
  }
  // Todo: https://jira.mongodb.org/browse/COMPASS-7080
  // It creates nested folder with appName as folder name.
  return path.join(basepath, appName);
}
