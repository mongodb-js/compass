require('babel-register')({ extensions: ['.jsx'] });

const React = require('react');
const ReactDOM = require('react-dom');
const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'server-stats',
  mongodb_database_name: 'admin'
});

const RTSSComponent = require('../../lib/components');

global.dataService = new DataService(CONNECTION);
global.dataService.connect((error) => {
  console.log(error);
  ReactDOM.render(
    React.createElement(RTSSComponent, { interval: 1000 }),
    document.getElementById('container')
  );
});
