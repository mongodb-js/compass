require('babel-register')({ extensions: ['.jsx'] });

const React = require('react');
const ReactDOM = require('react-dom');
const { DataServiceStore, DataServiceActions } = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');
const app = require('hadron-app');
const AppRegistry = require('hadron-app-registry');

const ServerStatsStore = require('../../lib/stores/server-stats-graphs-store');
const CurrentOpStore = require('../../lib/stores/current-op-store');
const TopStore = require('../../lib/stores/top-store');

// const debug = require('debug')('mongodb-compass:server-stats');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'server-stats',
  mongodb_database_name: 'admin'
});

const PerformanceComponent = require('../../lib/components');

DataServiceStore.listen((error, ds) => {
  global.hadronApp.appRegistry.onActivated();
  global.hadronApp.appRegistry.onConnected(error, ds);
  ReactDOM.render(
    React.createElement(PerformanceComponent),
    document.getElementById('container')
  );
});

global.hadronApp = app;
global.hadronApp.appRegistry = new AppRegistry();
global.hadronApp.appRegistry.registerStore('RTSS.ServerStatsStore', ServerStatsStore);
global.hadronApp.appRegistry.registerStore('RTSS.CurrentOpStore', CurrentOpStore);
global.hadronApp.appRegistry.registerStore('RTSS.TopStore', TopStore);
global.hadronApp.instance = { host: { cpu_cores: 4 } };
DataServiceActions.connect(CONNECTION);
