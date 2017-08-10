require('babel-register')({ extensions: ['.jsx'] });

const app = require('hadron-app');
const React = require('react');
const ReactDOM = require('react-dom');
const AppRegistry = require('hadron-app-registry');

const entryPoint = require('../../');
const appRegistry = new AppRegistry();
const ConnectComponent = require('../../src/components');

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;
entryPoint.activate(appRegistry);

// const dataService = new DataService(CONNECTION);
// dataService.onDataServiceInitialized(dataService);
// global.hadronApp.appRegistry.onActivated();
// dataService.connect((error, ds) => {
  // global.hadronApp.dataService = ds;
  // global.hadronApp.appRegistry.onConnected(error, ds);
// });

ReactDOM.render(
  React.createElement(ConnectComponent),
  document.getElementById('container')
);
