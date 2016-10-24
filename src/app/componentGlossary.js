/* eslint no-console:0 */
const Environment = require('../environment');
Environment.init();

const path = require('path');
const resourcePath = path.join(__dirname, '..', '..');

const ModuleCache = require('hadron-module-cache');
ModuleCache.register(resourcePath);
ModuleCache.add(resourcePath);

const Preferences = require('./models/preferences');
const AppRegistry = require('hadron-app-registry');
const { PackageManager } = require('hadron-package-manager');

const pkg = require('../../package.json');
const CompileCache = require('hadron-compile-cache');
CompileCache.setHomeDirectory(resourcePath);
CompileCache.digestMappings = pkg._compileCacheMappings || {};

const StyleManager = require('hadron-style-manager');
const styleManager = new StyleManager(path.join(__dirname, 'compiled-less'), __dirname);
styleManager.use(document, path.join(__dirname, 'help.less'));

window.jQuery = require('jquery');

/**
 * The main entrypoint for the application!
 */
const app = require('ampersand-app');
app.appRegistry = new AppRegistry();
app.packageManager = new PackageManager(path.join(__dirname, '..', 'internal-packages'));
app.packageManager.activate();

const ipc = require('hadron-ipc');

const debug = require('debug')('mongodb-compass:componentGlossary');

ipc.once('app:launched', function() {
  debug('in app:launched');
  if (process.env.NODE_ENV !== 'production') {
    require('debug').enable('mon*,had*');
    require('debug/browser');
  }
});

const preferences = new Preferences();
Object.defineProperty(app, 'preferences', {
  get: function() {
    return preferences;
  }
});

window.app = app;

// add Reflux store method to listen to external stores
const Reflux = require('reflux');
const { packageActivationCompleted } = require('hadron-package-manager/lib/action');
Reflux.StoreMethods.listenToExternalStore = function(storeKey, callback) {
  this.listenTo(packageActivationCompleted, () => {
    const store = app.appRegistry.getStore(storeKey);
    this.listenTo(store, callback);
    this.stopListeningTo(packageActivationCompleted);
  });
};
