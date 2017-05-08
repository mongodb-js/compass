const path = require('path');
const async = require('async');
const fs = require('fs');
const os = require('os');
const StyleManager = require('hadron-style-manager');
const pkg = require('../../package.json');

/**
 * The current distribution information.
 */
const DISTRIBUTION = pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION];

/**
 * The plugins directory constant.
 */
const PLUGINS_DIR = 'plugins-directory';

/**
 * Location of the dev packages.
 */
const DEV_PACKAGES = path.join(os.homedir(), DISTRIBUTION[PLUGINS_DIR]);

/**
 * Setup the style manager for the provided stylesheet.
 *
 * @param {String} stylesheet - The stylesheet.
 * @param {Function} done - The callback to execute when done.
 */
const setup = (stylesheet, done) => {
  const manager = new StyleManager(path.join(__dirname, 'compiled-less'), __dirname);
  const distributions = pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION];

  /**
   * @note: This is the legacy way to load styles - stays for backwards
   *   compatibility until all packages are external.
   */
  if (process.env.NODE_ENV !== 'production') {
    manager.use(document, path.join(__dirname, stylesheet));

    /**
     * @note: This loads all the styles from all the packages in the current
     *   distribution. The styles must be in package-root/styles/index.less
     *   This is for dev only, note that we will need to address pre-building
     *   and loading the prebuilt styles for the Compass artifacts for better
     *   performance.
     */
    manager.load(document, path.join(__dirname, '..', '..'), DISTRIBUTION.packages);
  }


  /**
   * For production we need to also look in the configured directory for local
   * developer plugins.
   */
  fs.readdir(DEV_PACKAGES, (error, files) => {
    if (error) {
      done();
    } else {
      manager.load(document, DEV_PACKAGES, files);
      done();
    }
  });
};

module.exports = setup;
