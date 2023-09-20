const marky = require('marky');
const remote = require('@electron/remote');
const app = require('hadron-app');
const pkg = require('../../package.json');
const path = require('path');
const { globalAppRegistry } = require('hadron-app-registry');
const PluginManager = require('@mongodb-js/hadron-plugin-manager');

const debug = require('debug')('mongodb-compass:setup-plugin-manager');

const appRegistry = globalAppRegistry;

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
const DEV_PLUGINS = path.join(
  remote.app.getPath('home'),
  DISTRIBUTION[PLUGINS_DIR]
);

marky.mark('Loading plugins');

const COMPASS_PLUGINS = require('./plugins/default');
const PLUGIN_COUNT = COMPASS_PLUGINS.length;

/**
 * @note: The 2nd and 3rd arguments are the root directory and an array
 *   of packages for the distribution and their relative paths from the
 *   root directory.
 */
app.pluginManager = new PluginManager([DEV_PLUGINS], ROOT, COMPASS_PLUGINS);

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
Module._load = function (request, loc) {
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

  if (loadedCount === PLUGIN_COUNT) {
    marky.stop('Loading plugins');
  }
});

app.pluginManager.activate(app.appRegistry, pkg.apiVersion);

debug(
  `Plugin manager activated with distribution ${process.env.HADRON_DISTRIBUTION}.`
);
