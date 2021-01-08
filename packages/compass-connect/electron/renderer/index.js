import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import { activate as activateKerberos } from '@mongodb-js/compass-auth-kerberos';
import { activate as activateLdap } from '@mongodb-js/compass-auth-ldap';
import { activate as activateX509 } from '@mongodb-js/compass-auth-x509';
import { activate as activateCompassStatus } from '@mongodb-js/compass-status';

import CompassConnectPlugin, { activate } from '../../src';

// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec.
import 'bootstrap/less/bootstrap.less';
import '../../src/assets/less/index.less';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
activateKerberos(appRegistry);
activateLdap(appRegistry);
activateX509(appRegistry);
activateCompassStatus(appRegistry);
appRegistry.onActivated();

appRegistry.on('data-service-connected', (err) => {
  if (!err) {
    appRegistry.getAction('Status.Actions').done();
  }
});

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');

root.id = 'root';
root.style.height = '100vh';
document.body.appendChild(root);

// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('root')
  );
};

// For initialization events to happen in isolation, uncomment the
// following lines as needed in the same places they are commented out.
//
// // Application was initialized.
// appRegistry.emit('application-initialized', '1.11.0-dev');

// Render our plugin - don't remove the following line
render(CompassConnectPlugin);

if (module.hot) {
  /**
   * Warning from React Router, caused by react-hot-loader.
   * The warning can be safely ignored, so filter it from the console.
   * Otherwise you'll see it every time something changes.
   * See https://github.com/gaearon/react-hot-loader/issues/298
   */
  const orgError = console.error; // eslint-disable-line no-console

  console.error = (message) => { // eslint-disable-line no-console
    if (message && message.indexOf('You cannot change <Router routes>;') === -1) {
      // Log the error as normally
      orgError.apply(console, [message]);
    }
  };

  module.hot.accept('../../src', () => render(CompassConnectPlugin));
}
