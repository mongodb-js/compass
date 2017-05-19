require('babel-register')({ extensions: ['.jsx'] });

const app = require('hadron-app');
const React = require('react');
const ReactDOM = require('react-dom');
const AppRegistry = require('hadron-app-registry');

const { DataServiceStore, DataServiceActions } = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');

const DeploymentAwarenessComponent = require('../../lib/components');
const DeploymentAwarenessStore = require('../../lib/stores');
const DeploymentAwarenessActions = require('../../lib/actions');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27017,
  ns: 'deployment-awareness',
  mongodb_database_name: 'admin'
});

DataServiceStore.listen((error, ds) => {
  global.hadronApp.dataService = ds;
  global.hadronApp.appRegistry.onConnected(error, ds);
});

global.hadronApp = app;
global.hadronApp.appRegistry = new AppRegistry();
global.hadronApp.appRegistry.registerStore('DeploymentAwareness.Store', DeploymentAwarenessStore);
global.hadronApp.appRegistry.registerAction('DeploymentAwareness.Actions', DeploymentAwarenessActions);

global.hadronApp.appRegistry.onActivated();

ReactDOM.render(
  React.createElement(DeploymentAwarenessComponent),
  document.getElementById('container')
);

DataServiceActions.connect(CONNECTION);
