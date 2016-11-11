/* eslint no-console:0 */
const Environment = require('../environment');
Environment.init();

const debug = require('debug')('mongodb-compass:glossary');

const path = require('path');
const resourcePath = path.join(__dirname, '..', '..');

const ModuleCache = require('hadron-module-cache');
ModuleCache.register(resourcePath);
ModuleCache.add(resourcePath);

const AppRegistry = require('hadron-app-registry');
const { PackageManager } = require('hadron-package-manager');

const CompileCache = require('hadron-compile-cache');
CompileCache.setHomeDirectory(resourcePath);
CompileCache.digestMappings = require('../../package.json')._compileCacheMappings || {};

const StyleManager = require('hadron-style-manager');
const styleManager = new StyleManager(path.join(__dirname, 'compiled-less'), __dirname);
styleManager.use(document, path.join(__dirname, 'styles/componentGlossary.less'));

window.jQuery = require('jquery');

/**
 * The main entrypoint for the application!
 */
const app = require('ampersand-app');
app.appRegistry = new AppRegistry();
app.packageManager = new PackageManager(path.join(__dirname, '..', 'internal-packages'));
app.packageManager.activate();

const Preferences = require('./models/preferences');
app.preferences = new Preferences();

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

packageActivationCompleted.listen(() => {
  const React = require('react');
  const ReactDOM = require('react-dom');
  const GlossaryComponent = app.appRegistry.getComponent('Glossary.Component');
  ReactDOM.render(React.createElement(GlossaryComponent), document.querySelector('#application'));

  require('./glossary/importPackages')(path.join(__dirname, '..', 'internal-packages'));
});

const addInspectElementMenu = require('debug-menu').install;
if (process.env.NODE_ENV !== 'production') {
  debug('Installing "Inspect Element" context menu');
  addInspectElementMenu();
}
