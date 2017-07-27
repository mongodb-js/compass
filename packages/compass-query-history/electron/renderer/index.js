require('babel-register')({ extensions: ['.jsx'] });

const app = require('hadron-app');
const React = require('react');
const ReactDOM = require('react-dom');
const AppRegistry = require('hadron-app-registry');

const { DataServiceStore, DataServiceActions } = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');
const { RecentQuery, RecentQueryCollection } = require('../../');

/**
 * Boilerplate.
 */
const CollectionStore = require('./stores/collection-store');
const DeploymentStateStore = require('./stores/deployment-state-store');

const QueryHistoryComponent = require('../../lib/components');
const QueryHistoryStore = require('../../lib/stores');
const QueryHistoryActions = require('../../lib/actions');

const appRegistry = new AppRegistry();

// const CONNECTION = new Connection({
  // hostname: '127.0.0.1',
  // port: 27018,
  // ns: 'query-history',
  // mongodb_database_name: 'admin'
// });

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;
appRegistry.registerStore('App.CollectionStore', CollectionStore);
require('../../').activate(appRegistry);
appRegistry.onActivated();
appRegistry.onConnected();

ReactDOM.render(
  React.createElement(QueryHistoryComponent),
  document.getElementById('container')
);
