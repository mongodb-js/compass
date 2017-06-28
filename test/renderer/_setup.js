require('../../src/app/setup-hadron-caches');
require('../../src/setup-hadron-distribution');

// Would be nice not to need this jQuery being present
window.jQuery = require('jquery');

// Require our internal-packages so we can integration-test things fast,
// i.e. without requiring a full functional test
const app = require('hadron-app');
const pkg = require('../../package.json');
const path = require('path');
const AppRegistry = require('hadron-app-registry');
const { PackageManager } = require('hadron-package-manager');

app.appRegistry = new AppRegistry();
global.hadronApp = app;

const INTERNAL_PACKAGES = path.join(__dirname, '..', 'internal-packages');

const ROOT = path.join(__dirname, '..', '..');

/**
 * @note: The 2nd and 3rd arguments are the root directory and an array
 *   of packages for the distribution and their relative paths from the
 *   root directory.
 */
app.packageManager = new PackageManager(
  [ INTERNAL_PACKAGES ],
  ROOT,
  pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION].packages
);

app.packageManager.activate(app.appRegistry);
