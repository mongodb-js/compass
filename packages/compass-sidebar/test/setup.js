const hadronApp = require('hadron-app');
const { AppRegistry } = require('hadron-app-registry');

const NamespaceStore = require('./mocks/namespace-store');
const CollectionStore = require('./mocks/collection-store');

const appRegistry = new AppRegistry();

global.hadronApp = hadronApp;
global.hadronApp.appRegistry = new AppRegistry();

appRegistry.registerStore('App.CollectionStore', CollectionStore);
appRegistry.registerStore('App.NamespaceStore', NamespaceStore);

appRegistry.onActivated();
