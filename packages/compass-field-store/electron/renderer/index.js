require('babel-register')({ extensions: ['.jsx'] });

const app = require('hadron-app');
const React = require('react');
const ReactDOM = require('react-dom');
const AppRegistry = require('hadron-app-registry');

const { DataServiceStore, DataServiceActions } = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');

/**
 * Boilerplate.
 */
const CollectionStore = require('./stores/collection-store');
const DeploymentStateStore = require('./stores/deployment-state-store');

const CompassFieldStoreComponent = require('../../lib/components');
const CompassFieldStoreStore = require('../../lib/stores');
const CompassFieldStoreActions = require('../../lib/actions');

// const CONNECTION = new Connection({
  // hostname: '127.0.0.1',
  // port: 27018,
  // ns: 'compass-field-store',
  // mongodb_database_name: 'admin'
// });

global.hadronApp = app;
global.hadronApp.appRegistry = new AppRegistry();
global.hadronApp.appRegistry.registerStore('App.CollectionStore', CollectionStore);
global.hadronApp.appRegistry.registerStore('DeploymentAwareness.DeploymentStateStore', DeploymentStateStore);
global.hadronApp.appRegistry.registerStore('CompassFieldStore.Store', CompassFieldStoreStore);
global.hadronApp.appRegistry.registerAction('CompassFieldStore.Actions', CompassFieldStoreActions);

// const dataService = new DataService(CONNECTION);
// dataService.onDataServiceInitialized(dataService);
// dataService.connect((error, ds) => {
  // global.hadronApp.dataService = ds;
  global.hadronApp.appRegistry.onActivated();
  // global.hadronApp.appRegistry.onConnected(error, ds);
// });

ReactDOM.render(
  React.createElement(CompassFieldStoreComponent),
  document.getElementById('container')
);
