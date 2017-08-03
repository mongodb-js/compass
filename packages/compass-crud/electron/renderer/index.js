require('babel-register')({ extensions: ['.jsx'] });

window.jQuery = require('jquery');

const app = require('hadron-app');
const React = require('react');
const ReactDOM = require('react-dom');
const AppRegistry = require('hadron-app-registry');

const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');
const DocumentList = require('../../src/components/document-list');

// const CONNECTION = new Connection({
  // hostname: '127.0.0.1',
  // port: 27018,
  // ns: 'compass-crud',
  // mongodb_database_name: 'admin'
// });

const entryPoint = require('../../');
const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

global.hadronApp.instance = {
  build: '3.4.0'
};

entryPoint.activate(appRegistry);

// Stores/Actions/Components required from other plugins/Compass:
const CollectionStore = require('./stores/collection-store');
const NamespaceStore = require('./stores/namespace-store');
const QueryChangedStore = require('./stores/query-changed-store');
const SamplingMessage = require('./components/sampling-message');
const QueryBar = require('./components/query-bar');
appRegistry.registerStore('App.NamespaceStore', NamespaceStore);
appRegistry.registerStore('App.CollectionStore', CollectionStore);
appRegistry.registerStore('Query.ChangedStore', QueryChangedStore);
appRegistry.registerComponent('Query.SamplingMessage', SamplingMessage);
appRegistry.registerComponent('Query.QueryBar', QueryBar);

appRegistry.onActivated();

// const dataService = new DataService(CONNECTION);
// dataService.onDataServiceInitialized(dataService);
// dataService.connect((error, ds) => {
  // global.hadronApp.dataService = ds;
  // global.hadronApp.appRegistry.onConnected(error, ds);
// });

ReactDOM.render(
  React.createElement(DocumentList),
  document.getElementById('container')
);
