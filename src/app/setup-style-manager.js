const path = require('path');
const StyleManager = require('hadron-style-manager');
const pkg = require('../../package.json');

const manager = new StyleManager(path.join(__dirname, 'compiled-less'), __dirname);

/**
 * @note: This is the legacy way to load styles - stays for backwards
 *   compatibility until all packages are external.
 */
manager.use(document, path.join(__dirname, 'index.less'));

/**
 * @note: This loads all the styles from all the packages in the current
 *   distribution. The styles must be in package-root/styles/index.less
 *   This is for dev only, note that we will need to address pre-building
 *   and loading the prebuilt styles for the Compass artifacts for better
 *   performance.
 */
manager.load(
  document,
  path.join(__dirname, '..', '..'),
  pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION].packages
);
