require('babel-register')({ extensions: ['.jsx'] });

const React = require('react');
const ReactDOM = require('react-dom');
const { DataServiceStore, DataServiceActions } = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');
const app = require('hadron-app');
const AppRegistry = require('hadron-app-registry');

// const debug = require('debug')('mongodb-compass:server-stats');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'server-stats',
  mongodb_database_name: 'admin'
});

const PerformanceComponent = require('../../lib/components');

DataServiceStore.listen((error, ds) => {
  ReactDOM.render(
    React.createElement(PerformanceComponent),
    document.getElementById('container')
  );
});

app.appRegistry = new AppRegistry();
app.instance = { host: { cpu_cores: 4 } };
DataServiceActions.connect(CONNECTION);
