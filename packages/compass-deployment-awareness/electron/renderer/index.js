/* eslint react/no-multi-comp: 0 */
import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import DeploymentAwarenessPlugin, { activate } from '../../src/index.js';
import DataService from 'mongodb-data-service';
import Connection from 'mongodb-connection-model';

// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'bootstrap/less/bootstrap.less';
import 'less/index.less';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
appRegistry.onActivated();

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27017,
  ns: 'compass-deployment-awareness',
  mongodb_database_name: 'admin'
});

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.id = 'root';
root.style.width = '100vw';
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

// Render our plugin - don't remove the following line.
render(DeploymentAwarenessPlugin);

const dataService = new DataService(CONNECTION);

dataService.connect((error, ds) => {
  global.hadronApp.dataService = ds;
  appRegistry.emit('data-service-connected', error, ds);
  appRegistry.emit('instance-refreshed', { instance: { dataLake: { isDataLake: false, version: '1.0.0' }}});
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
    render(DeploymentAwarenessPlugin);
  });
}
