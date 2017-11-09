require('babel-register')({ extensions: ['.jsx'] });

const app = require('hadron-app');
const React = require('react');
const ReactDOM = require('react-dom');
const AppRegistry = require('hadron-app-registry');
const kerberos = require('@mongodb-js/compass-auth-kerberos');
const ldap = require('@mongodb-js/compass-auth-ldap');
const x509 = require('@mongodb-js/compass-auth-x509');
const compassStatus = require('@mongodb-js/compass-status');

const entryPoint = require('../../');
const appRegistry = new AppRegistry();
const Container = require('./container');

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;
entryPoint.activate(appRegistry);
kerberos.activate(appRegistry);
ldap.activate(appRegistry);
x509.activate(appRegistry);
compassStatus.activate(appRegistry);

appRegistry.onActivated();

appRegistry.on('data-service-connected', (err, ds) => {
  if (!err) {
    appRegistry.getAction('Status.Actions').done();
  }
});

ReactDOM.render(
  React.createElement(Container),
  document.getElementById('container')
);
