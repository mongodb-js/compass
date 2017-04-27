const app = require('hadron-app');
const pkg = require('../../package.json');
const path = require('path');
const os = require('os');
const AppRegistry = require('hadron-app-registry');
const { PackageManager } = require('hadron-package-manager');
const debug = require('debug')('mongodb-compass:setup-package-manager');

app.appRegistry = new AppRegistry();

/**
 * Location of the internal packages.
 */
const INTERNAL_PACKAGES = path.join(__dirname, '..', 'internal-packages');

/**
 * Location of the dev packages.
 */
const DEV_PACKAGES = path.join(os.homedir(), '.compass');

/**
 * The root dir.
 */
const ROOT = path.join(__dirname, '..', '..');

/**
 * @note: The 2nd and 3rd arguments are the root directory and an array
 *   of packages for the distribution and their relative paths from the
 *   root directory.
 */
app.packageManager = new PackageManager(
  [ INTERNAL_PACKAGES, DEV_PACKAGES ],
  ROOT,
  pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION].packages
);

app.packageManager.activate();

debug(`Package manager activated with distribution ${process.env.HADRON_DISTRIBUTION}.`);
