const path = require('path');
const { getStoragePaths } = require('@mongodb-js/compass-utils');

export function getUserDataFilePath(filename) {
  const { appName, basepath } = getStoragePaths() || {};
  if (appName === undefined || basepath === undefined) return;

  // Todo: https://jira.mongodb.org/browse/COMPASS-7080
  // We should directly call getStoragePaths wherever this function is called.
  // It creates nested folder with appName as folder name.
  return path.join(basepath, appName, filename);
}
