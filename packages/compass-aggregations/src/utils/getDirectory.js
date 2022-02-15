const DIRNAME = 'SavedPipelines';

/**
 * Get the directory pipelines are stored in.
 *
 * @returns {String} The directory.
 */
export const getDirectory = () => {
  const { remote } = require('electron');
  const path = require('path');
  const userDataDir = remote
    ? remote.app.getPath('userData')
    : process.env.MONGODB_COMPASS_AGGREGATIONS_TEST_BASE_PATH;
  return path.join(userDataDir, DIRNAME);
};
