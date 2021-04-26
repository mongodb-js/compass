/* eslint-disable no-console */
import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import CompassShellPlugin, { activate } from 'plugin';
import { MongoClient } from 'mongodb';

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

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.

const root = document.createElement('div');


root.id = 'root';
root.style.height = '100%';
root.style.width = '100%';
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

// Render our plugin - don't remove the following line.
render(CompassShellPlugin);

// // Data service initialization and connection.

// Note: the dataservice is not really used by the shell plugin, only the
// mongoclient is. For that reason we can use a mocked one, this avoid
// the dependency to keytar:
//
const connectionOptions = {
  url: 'mongodb://localhost:27020/test?readPreference=primary&ssl=false',
  options: {
    sslValidate: false,
  },
};

MongoClient.connect(
  connectionOptions.url,
  connectionOptions.options,
  (error, client) => {
    const dataService = {
      client: { client },
      getConnectionOptions() {
        return connectionOptions;
      },
    };

    appRegistry.emit('data-service-initialized', dataService);
    appRegistry.emit('data-service-connected', error, dataService);

    if (error) {
      console.error('Unable to connect to', connectionOptions.url, error);
      return;
    }

    console.info('Connected to', connectionOptions.url);

    appRegistry.emit('data-service-initialized', dataService);
    appRegistry.emit('data-service-connected', error, dataService);
  }
);

if (module.hot) {
  module.hot.accept('plugin', () => render(CompassShellPlugin));
}
