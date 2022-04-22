// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'mongodb-compass/src/app/styles/index.less';

const React = require('react');
const ReactDOM = require('react-dom');
const { DataServiceImpl } = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');
const app = require('hadron-app');
const { AppRegistry } = require('hadron-app-registry');

const ServerStatsStore = require('../../src/stores/server-stats-graphs-store');
const CurrentOpStore = require('../../src/stores/current-op-store');
const TopStore = require('../../src/stores/top-store');

// const debug = require('debug')('mongodb-compass:server-stats');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27020,
  ns: 'server-stats',
  mongodb_database_name: 'admin'
});

const PerformanceComponent = require('../../src/components');

global.hadronApp = app;
global.hadronApp.appRegistry = new AppRegistry();
global.hadronApp.appRegistry.registerStore(
  'RTSS.ServerStatsStore',
  ServerStatsStore
);
global.hadronApp.appRegistry.registerStore(
  'RTSS.CurrentOpStore',
  CurrentOpStore
);
global.hadronApp.appRegistry.registerStore('RTSS.TopStore', TopStore);
global.hadronApp.instance = { host: { cpu_cores: 4 } };

const dataService = new DataServiceImpl(CONNECTION);
dataService.connect((error, ds) => {
  global.hadronApp.appRegistry.onActivated();
  global.hadronApp.appRegistry.emit('data-service-connected', error, ds);
  ReactDOM.render(
    React.createElement(PerformanceComponent),
    document.getElementById('container')
  );
});
