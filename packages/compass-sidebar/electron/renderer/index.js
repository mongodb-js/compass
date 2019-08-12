import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import SidebarPlugin, { activate } from 'plugin';
import DeploymentStateStore from './stores/deployment-state-store';
import { activate as appActivate } from '@mongodb-js/compass-app-stores';
import { activate as headerActivate } from '@mongodb-js/compass-instance-header';
import { activate as awarenessActivate } from '@mongodb-js/compass-deployment-awareness';
import { activate as versionActivate } from '@mongodb-js/compass-server-version';
import { activate as sshActivate } from '@mongodb-js/compass-ssh-tunnel-status';
import InstanceModel from 'mongodb-instance-model';

// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'bootstrap/less/bootstrap.less';
import 'less/index.less';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;
global.hadronApp.instance = new InstanceModel();

activate(appRegistry);
appActivate(appRegistry);
headerActivate(appRegistry);
awarenessActivate(appRegistry);
versionActivate(appRegistry);
sshActivate(appRegistry);

appRegistry.onActivated();

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.style = 'height: 100%';
root.id = 'root';
document.body.appendChild(root);

// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component onCollapse={()=>{}}/>
    </AppContainer>,
    document.getElementById('root')
  );
};

// For initialization events to happen in isolation, uncomment the
// following lines as needed in the same places they are commented out.
//
// // Application was initialized.
// appRegistry.emit('application-initialized', '1.11.0-dev');

// Render our plugin - don't remove the following line.
render(SidebarPlugin);

// Data service initialization and connection.
import Connection from 'mongodb-connection-model';
import DataService from 'mongodb-data-service';

const connection = new Connection({
  hostname: '127.0.0.1',
  port: 27017,
  is_favorite: true,
  name: 'This is a reallllllllllllllly long connection name'
});
const dataService = new DataService(connection);

global.hadronApp.instance.genuineMongoDB = { isGenuine: false, dbType: 'cosmos' };

const state = {
  instance: global.hadronApp.instance
};

DeploymentStateStore.setToInitial();
appRegistry.emit('data-service-initialized', dataService);
dataService.connect((error, ds) => {
  ds.client.model.ssh_tunnel = 'USER_PASSWORD';
  ds.client.model.ssh_tunnel_hostname = '123.45.67.89';
  appRegistry.emit('data-service-connected', error, ds);
  appRegistry.emit('instance-refreshed', state);
});

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

  module.hot.accept('plugin', () => {
    // Because Webpack 2 has built-in support for ES2015 modules,
    // you won't need to re-require your app root in module.hot.accept
    render(SidebarPlugin);
  });
}
