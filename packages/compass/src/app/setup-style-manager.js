const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const os = require('os');
const StyleManager = require('hadron-style-manager');
const debug = require('debug')('mongodb-compass:setup-style-manager');
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
 * Location of the dev plugins.
 */
const DEV_PLUGINS = path.join(os.homedir(), DISTRIBUTION[PLUGINS_DIR]);

/**
 * The style tag constant.
 */
const STYLE = 'style';

/**
 * Setup the style manager for the provided stylesheet.
 *
 * @param {String} stylesheet - The stylesheet.
 * @param {Function} done - The callback to execute when done.
 */
const setup = (stylesheet, done) => {
  /**
   * @note: This is the legacy way to load styles - stays for backwards
   *   compatibility until all packages are external.
   */
  if (process.env.NODE_ENV !== 'production') {
    const manager = new StyleManager(path.join(__dirname, 'compiled-less'), __dirname);
    manager.use(document, path.join(__dirname, stylesheet));

    /**
     * @note: This loads all the styles from all the plugins in the current
     *   distribution. The styles must be in plugin-root/styles/index.less
     *   This is for dev only, note that we will need to address pre-building
     *   and loading the prebuilt styles for the Compass artifacts for better
     *   performance.
     */
    manager.load(document, path.join(__dirname, '..', '..'), DISTRIBUTION.plugins);
  }


  /**
   * For production we need to also look in the configured directory for local
   * developer plugins.
   */
  fs.readdir(DEV_PLUGINS, (error, files) => {
    if (error) {
      done();
    } else {
      _.each(files, (file) => {
        /**
         * @durran - Temporary for workshop - will fix in style manager after.
         */
        try {
          const styles = document.createElement(STYLE);
          const loc = path.join(DEV_PLUGINS, file, 'lib', 'styles', 'index.css');

          // eslint-disable-next-line no-sync
          styles.textContent = fs.readFileSync(loc, { encoding: 'utf8' });
          document.head.appendChild(styles);
        } catch (e) {
          debug(e.message);
        }
      });
      done();
    }
  });
};

module.exports = setup;
