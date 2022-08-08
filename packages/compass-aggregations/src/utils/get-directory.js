const DIRNAME = 'SavedPipelines';

let electronApp;
try {
  electronApp = require('@electron/remote').app
} catch (e) {
  console.log('Could not load @electron/remote', e.message);
}

/**
 * Get the directory pipelines are stored in.
 *
 * @returns {String} The directory.
 */
export const getDirectory = () => {
  const path = require('path');
  const userDataDir =
    // Test path needs to take precedence in all cases, otherwise we can't mock
    // this value when testing in electron runtime
    process.env.MONGODB_COMPASS_AGGREGATIONS_TEST_BASE_PATH ||
    electronApp?.getPath('userData');
  return path.join(userDataDir, DIRNAME);
};
