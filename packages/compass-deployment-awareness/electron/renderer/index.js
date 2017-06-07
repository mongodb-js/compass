require('babel-register')({ extensions: ['.jsx'] });

const app = require('hadron-app');
const React = require('react');
const ReactDOM = require('react-dom');
const AppRegistry = require('hadron-app-registry');

const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');

const DeploymentAwarenessComponent = require('../../lib/components');
const DeploymentAwarenessStore = require('../../lib/stores');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27017,
  ns: 'admin',
  mongodb_database_name: 'admin'
});

global.hadronApp = app;
global.hadronApp.appRegistry = new AppRegistry();
global.hadronApp.appRegistry.registerStore('DeploymentAwareness.Store', DeploymentAwarenessStore);

const dataService = new DataService(CONNECTION);
global.hadronApp.appRegistry.onDataServiceInitialized(dataService);

dataService.connect((error, ds) => {
  global.hadronApp.dataService = ds;
  global.hadronApp.appRegistry.onConnected(error, ds);

  global.hadronApp.appRegistry.onActivated();

  ReactDOM.render(
    React.createElement(DeploymentAwarenessComponent),
    document.getElementById('container')
  );
});
