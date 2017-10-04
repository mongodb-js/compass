require('babel-register')({ extensions: ['.jsx'] });

window.jQuery = require('jquery');

const app = require('hadron-app');
const React = require('react');
const ReactDOM = require('react-dom');
const AppRegistry = require('hadron-app-registry');

const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');
const DocumentList = require('../../lib/components/document-list');

const DB = 'compass-crud';
const COLL = 'test';

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27017,
  ns: DB,
  mongodb_database_name: 'admin'
});

const entryPoint = require('../../');
const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

global.hadronApp.instance = {
  build: {
    version: '3.4.0'
  }
};

entryPoint.activate(appRegistry);

// Stores/Actions/Components required from other plugins/Compass:
const CollectionStore = require('./stores/collection-store');
const NamespaceStore = require('./stores/namespace-store');
const QueryChangedStore = require('./stores/query-changed-store');
const QueryBar = require('./components/query-bar');
const TextWriteButton = require('./components/text-write-button');
appRegistry.registerStore('App.NamespaceStore', NamespaceStore);
appRegistry.registerStore('App.CollectionStore', CollectionStore);
appRegistry.registerStore('Query.ChangedStore', QueryChangedStore);
appRegistry.registerComponent('Query.QueryBar', QueryBar);
appRegistry.registerComponent('DeploymentAwareness.TextWriteButton', TextWriteButton);

appRegistry.onActivated();

const dataService = new DataService(CONNECTION);
appRegistry.emit('data-service-initialized', dataService);

dataService.connect((error, ds) => {
  global.hadronApp.dataService = ds;
  appRegistry.emit('data-service-connected', error, ds);

  // Set the namespace for the CRUD plugin.
  CollectionStore.setCollection({ _id: `${DB}.${COLL}` });
  QueryChangedStore.onQueryStoreChanged({ns: `${DB}.${COLL}`});
});

ReactDOM.render(
  React.createElement(DocumentList),
  document.getElementById('container')
);
