const DIRNAME = 'SavedPipelines';

/**
 * Get the directory pipelines are stored in.
 *
 * @returns {String} The directory.
 */
export const getDirectory = () => {
  const { remote } = require('electron');
  const path = require('path');
  const userDataDir =
    // Test path needs to take precedence in all cases, otherwise we can't mock
    // this value when testing in electron runtime
    process.env.MONGODB_COMPASS_AGGREGATIONS_TEST_BASE_PATH ||
    remote.app.getPath('userData');
  return path.join(userDataDir, DIRNAME);
};
