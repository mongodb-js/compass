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
const DISTRIBUTION = pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION];

/**
 * The plugins directory constant.
 */
const PLUGINS_DIR = 'plugins-directory';

/**
 * Location of the dev plugins.
 */
const DEV_PLUGINS = path.join(os.homedir(), DISTRIBUTION[PLUGINS_DIR]);

const PLUGIN_COUNT = DISTRIBUTION.plugins.length;

/**
 * @note: The 2nd and 3rd arguments are the root directory and an array
 *   of packages for the distribution and their relative paths from the
 *   root directory.
 */
app.pluginManager = new PluginManager(
  [ DEV_PLUGINS ],
  ROOT,
  DISTRIBUTION.plugins
);

/**
 * Security related items before moving them to security plugin, phase 1.
 */
const Module = require('module');
const loader = Module._load;

/**
 * The require error message.
 */
const ERROR = 'Due to security reasons, 3rd party plugins are not allowed to require ' +
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
  ipc.call(
    'compass:loading:change-status',
    { status: `loading plugins ${loadedCount}/${PLUGIN_COUNT}` }
  );
});

if (process.env.NODE_ENV === 'production') {
  /* eslint no-eval:0 */
  window.eval = global.eval = function() {
    throw new Error('Due to security reasons, eval() is not supported.');
  };
}

app.pluginManager.activate(app.appRegistry, pkg.apiVersion);

debug(`Plugin manager activated with distribution ${process.env.HADRON_DISTRIBUTION}.`);
