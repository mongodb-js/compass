import path from 'path';
import { getStoragePaths } from '@mongodb-js/compass-utils';
const { appName, basepath } = getStoragePaths() || {};

export function getUserDataFolderPath() {
  if (appName === undefined || basepath === undefined) return;

  return path.join(basepath, appName);
}
