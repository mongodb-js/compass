const hadronApp = require('hadron-app');
const { AppRegistry } = require('hadron-app-registry');

const WriteStateStore = require('./mocks/deployment-state-store');
const NamespaceStore = require('./mocks/namespace-store');
const CollectionStore = require('./mocks/collection-store');

const appRegistry = new AppRegistry();

global.hadronApp = hadronApp;
global.hadronApp.appRegistry = new AppRegistry();

appRegistry.registerStore('DeploymentAwareness.WriteStateStore', WriteStateStore);
appRegistry.registerStore('App.CollectionStore', CollectionStore);
appRegistry.registerStore('App.NamespaceStore', NamespaceStore);

appRegistry.onActivated();
