/* eslint no-console:0 */
const Environment = require('../environment');
Environment.init();

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
styleManager.use(document, path.join(__dirname, 'help.less'));

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

/**
 * Once you actually have a glossary component, comment out the below to render.
 */
// const React = require('react');
// const ReactDOM = require('react-dom');
// const glossary = app.appRegistry.getComponent('Glossary.Glossary');
// ReactDOM.render(React.createElement(glossary), document.querySelector('#application'));
