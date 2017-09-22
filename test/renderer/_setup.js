require('../../src/app/setup-hadron-caches');
require('../../src/setup-hadron-distribution');

require('../../src/app/reflux-listen-to-external-store');

// Would be nice not to need this jQuery being present
window.jQuery = require('jquery');

// Require our internal-plugins so we can integration-test things fast,
// i.e. without requiring a full functional test
const app = require('hadron-app');
const pkg = require('../../package.json');
const path = require('path');
const AppRegistry = require('hadron-app-registry');
const PluginManager = require('hadron-plugin-manager');

app.appRegistry = new AppRegistry();
global.hadronApp = app;

const INTERNAL_PLUGINS = path.join(__dirname, '..', 'internal-plugins');

const ROOT = path.join(__dirname, '..', '..');

/**
 * @note: The 2nd and 3rd arguments are the root directory and an array
 *   of plugins for the distribution and their relative paths from the
 *   root directory.
 */
app.pluginManager = new PluginManager(
  [ INTERNAL_PLUGINS ],
  ROOT,
  pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION].plugins
);

app.pluginManager.activate(app.appRegistry);
