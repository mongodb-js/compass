import path from 'path';
import { getStoragePaths } from '@mongodb-js/compass-utils';

export function getUserDataFolderPath() {
  const { appName, basepath } = getStoragePaths() || {};
  if (appName === undefined || basepath === undefined) {
    throw new Error('cannot access user data folder path');
  }
  // Todo: https://jira.mongodb.org/browse/COMPASS-7080
  // We should directly call getStoragePaths wherever this function is called.
  // It creates nested folder with appName as folder name.
  return path.join(basepath, appName);
}
