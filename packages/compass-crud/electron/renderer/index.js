require('babel-register')({ extensions: ['.jsx'] });

const app = require('hadron-app');
const React = require('react');
const ReactDOM = require('react-dom');
const AppRegistry = require('hadron-app-registry');

const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');

const CompassCrudComponent = require('../../lib/components');
const CompassCrudStore = require('../../lib/stores');
const CompassCrudActions = require('../../lib/actions');

// const CONNECTION = new Connection({
  // hostname: '127.0.0.1',
  // port: 27018,
  // ns: 'compass-crud',
  // mongodb_database_name: 'admin'
// });

global.hadronApp = app;
global.hadronApp.appRegistry = new AppRegistry();
global.hadronApp.appRegistry.registerStore('CompassCrud.Store', CompassCrudStore);
global.hadronApp.appRegistry.registerAction('CompassCrud.Actions', CompassCrudActions);

// const dataService = new DataService(CONNECTION);
// dataService.onDataServiceInitialized(dataService);
// global.hadronApp.appRegistry.onActivated();
// dataService.connect((error, ds) => {
  // global.hadronApp.dataService = ds;
  // global.hadronApp.appRegistry.onConnected(error, ds);
// });

ReactDOM.render(
  React.createElement(CompassCrudComponent),
  document.getElementById('container')
);
