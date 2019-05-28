import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import CompassSchemaValidationPlugin, { activate } from 'plugin';
import configureStore, { setDataProvider } from 'stores';

// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'bootstrap/less/bootstrap.less';
import 'less/index.less';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

const WriteStateStore = require('./stores/write-state-store');

appRegistry.registerStore('DeploymentAwareness.WriteStateStore', WriteStateStore);

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
appRegistry.onActivated();

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');

root.style = 'height: 100vh';
root.id = 'root';
document.body.appendChild(root);

const localAppRegistry = new AppRegistry();
const store = configureStore({
  localAppRegistry: localAppRegistry,
  globalAppRegistry: appRegistry,
  serverVersion: '4.2.0',
  namespace: 'echo.artists'
});

// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component store={store} />
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
render(CompassSchemaValidationPlugin);

// Data service initialization and connection.
import Connection from 'mongodb-connection-model';
import DataService from 'mongodb-data-service';

const connection = new Connection({
  hostname: '127.0.0.1',
  port: 27017,
  ns: 'admin'
});
const dataService = new DataService(connection);

dataService.connect((error, ds) => {
  setDataProvider(store, error, ds);
  localAppRegistry.emit('fields-changed', {
    fields: {
      harry: {
        name: 'harry', path: 'harry', count: 1, type: 'Number'
      },
      potter: {
        name: 'potter', path: 'potter', count: 1, type: 'Boolean'
      }
    },
    topLevelFields: [ 'harry', 'potter' ],
    aceFields: [
      { name: 'harry',
        value: 'harry',
        score: 1,
        meta: 'field',
        version: '0.0.0' },
      { name: 'potter',
        value: 'potter',
        score: 1,
        meta: 'field',
        version: '0.0.0' }
    ]
  });
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

  module.hot.accept('plugin', () => render(CompassSchemaValidationPlugin));
}
