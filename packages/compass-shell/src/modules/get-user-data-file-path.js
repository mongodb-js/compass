const path = require('path');
const { getStoragePaths } = require('@mongodb-js/compass-utils');
const { appName, basepath } = getStoragePaths() || {};


export function getUserDataFilePath(filename) {
  if (appName === undefined || basepath === undefined) return;

  return path.join(
    basepath,
    appName,
    filename
  );
}
