require('babel-register')({ extensions: ['.jsx'] });

const app = require('hadron-app');
const React = require('react');
const ReactDOM = require('react-dom');
const AppRegistry = require('hadron-app-registry');
const kerberos = require('@mongodb-js/compass-auth-kerberos');

const entryPoint = require('../../');
const appRegistry = new AppRegistry();
const ConnectComponent = require('../../lib/components');

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;
entryPoint.activate(appRegistry);
kerberos.activate(appRegistry);

appRegistry.onActivated();

ReactDOM.render(
  React.createElement(ConnectComponent),
  document.getElementById('container')
);
