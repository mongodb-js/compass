const app = require('hadron-app');
const pkg = require('../../package.json');
const path = require('path');
const os = require('os');
const AppRegistry = require('hadron-app-registry');
const PluginManager = require('@mongodb-js/hadron-plugin-manager');
const ipc = require('hadron-ipc');

const debug = require('debug')('mongodb-compass:setup-plugin-manager');

/**
 * Create a new app registry and prevent modification.
 */
const appRegistry = Object.freeze(new AppRegistry());

app.appRegistry = appRegistry;

/**
 * The root dir.
 */
const ROOT = path.join(__dirname, '..', '..');

/**
 * The current distribution information.
 */
const DISTRIBUTION =
  pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION];

/**
 * The plugins directory constant.
 */
const PLUGINS_DIR = 'plugins-directory';

/**
 * Location of the dev plugins.
 */
const DEV_PLUGINS = path.join(os.homedir(), DISTRIBUTION[PLUGINS_DIR]);

const COMPASS_PLUGINS = [
  require('@mongodb-js/compass-app-stores'),
  require('@mongodb-js/compass-aggregations'),
  require('@mongodb-js/compass-auto-updates'),
  require('@mongodb-js/compass-export-to-language'),
  require('@mongodb-js/compass-collection'),
  require('@mongodb-js/compass-collection-stats'),
  require('@mongodb-js/compass-crud'),
  require('@mongodb-js/compass-database'),
  require('@mongodb-js/compass-databases-collections'),
  require('@mongodb-js/compass-field-store'),
  require('@mongodb-js/compass-find-in-page'),
  require('@mongodb-js/compass-home'),
  require('@mongodb-js/compass-import-export'),
  require('@mongodb-js/compass-connect'),
  require('@mongodb-js/compass-schema'),
  require('@mongodb-js/compass-schema-validation'),
  require('@mongodb-js/compass-deployment-awareness'),
  require('@mongodb-js/compass-metrics'),
  require('@mongodb-js/compass-query-bar'),
  require('@mongodb-js/compass-query-history'),
  require('@mongodb-js/compass-loading'),
  require('@mongodb-js/compass-plugin-info'),
  require('@mongodb-js/compass-instance'),
  require('@mongodb-js/compass-serverstats'),
  require('@mongodb-js/compass-server-version'),
  require('@mongodb-js/compass-sidebar'),
  require('@mongodb-js/compass-ssh-tunnel-status'),
  require('@mongodb-js/compass-status'),
  require('@mongodb-js/compass-indexes'),
  require('@mongodb-js/compass-explain-plan')
];

const PLUGIN_COUNT = COMPASS_PLUGINS.length;

/**
 * @note: The 2nd and 3rd arguments are the root directory and an array
 *   of packages for the distribution and their relative paths from the
 *   root directory.
 */
app.pluginManager = new PluginManager(
  [DEV_PLUGINS],
  ROOT,
  COMPASS_PLUGINS
);

/**
 * Security related items before moving them to security plugin, phase 1.
 */
const Module = require('module');
const loader = Module._load;

/**
 * The require error message.
 */
const ERROR =
  'Due to security reasons, 3rd party plugins are not allowed to require ' +
  'modules with filesystem (fs), network (net/tls), or child process (child_process) access.';

/**
 * List of modules that cannot be required.
 */
const ILLEGAL_MODULES = ['fs', 'net', 'tls', 'child_process'];

/**
 * Prevent loading of fs, net, tls, and child process for 3rd party plugins.
 *
 * @param {String} request - The request.
 * @param {Object} loc - The location.
 *
 * @returns {Function}
 */
Module._load = function(request, loc) {
  if (ILLEGAL_MODULES.includes(request)) {
    if (loc.filename.includes(DEV_PLUGINS)) {
      const error = new Error(ERROR);
      error.stack = '';
      throw error;
    }
  }
  return loader.apply(this, arguments);
};

let loadedCount = 0;

PluginManager.Action.pluginActivated.listen(() => {
  loadedCount++;
  ipc.call('compass:loading:change-status', {
    status: `loading plugins ${loadedCount}/${PLUGIN_COUNT}`
  });
});

app.pluginManager.activate(app.appRegistry, pkg.apiVersion);

debug(
  `Plugin manager activated with distribution ${process.env.HADRON_DISTRIBUTION}.`
);
