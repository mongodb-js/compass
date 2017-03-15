const app = require('hadron-app');
const pkg = require('../../package.json');
const path = require('path');
const AppRegistry = require('hadron-app-registry');
const { PackageManager } = require('hadron-package-manager');
const debug = require('debug')('mongodb-compass:setup-package-manager');

app.appRegistry = new AppRegistry();

/**
 * @note: The 2nd and 3rd arguments are the root directory and an array
 *   of packages for the distribution and their relative paths from the
 *   root directory.
 */
app.packageManager = new PackageManager(
  path.join(__dirname, '..', 'internal-packages'),
  path.join(__dirname, '..', '..'),
  pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION].packages
);
app.packageManager.activate();

debug(`Package manager activated with distribution ${process.env.HADRON_DISTRIBUTION}.`);
