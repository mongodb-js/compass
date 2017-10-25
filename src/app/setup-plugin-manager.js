const app = require('hadron-app');
const pkg = require('../../package.json');
const path = require('path');
const os = require('os');
const AppRegistry = require('hadron-app-registry');
const PluginManager = require('hadron-plugin-manager');
const debug = require('debug')('mongodb-compass:setup-plugin-manager');

app.appRegistry = new AppRegistry().setMaxListeners(50);

/**
 * Location of the internal plugins.
 */
const INTERNAL_PLUGINS = path.join(__dirname, '..', 'internal-plugins');

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

/**
 * Dev plugins lib directory.
 */
const DEV_PLUGINS_LIB = path.join(DEV_PLUGINS, 'lib');

/**
 * @note: The 2nd and 3rd arguments are the root directory and an array
 *   of packages for the distribution and their relative paths from the
 *   root directory.
 */
app.pluginManager = new PluginManager(
  [ INTERNAL_PLUGINS, DEV_PLUGINS ],
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
  'modules with filesystem, network, or child process access.';

/**
 * List of modules that cannot be required.
 */
const ILLEGAL_MODULES = ['fs', 'net', 'tls', 'child_process'];

/**
 * Prevent loading of fs, net, tls, and child process for 3rd party plugins.
 */
Module._load = function(request, loc) {
  if (ILLEGAL_MODULES.includes(request)) {
    if (loc.filename.includes(DEV_PLUGINS_LIB)) {
      throw new Error(ERROR);
    }
  }
  return loader.apply(this, arguments);
};

app.pluginManager.activate(app.appRegistry);

debug(`Plugin manager activated with distribution ${process.env.HADRON_DISTRIBUTION}.`);
