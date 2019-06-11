/* eslint react/no-multi-comp: 0 */
import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import CollectionPlugin, { activate } from 'plugin';
import { activate as activateAgg } from '@mongodb-js/compass-aggregations';
import { activate as activateCrud } from '@mongodb-js/compass-crud';
import { activate as activateDA } from '@mongodb-js/compass-deployment-awareness';
import { activate as activateStats } from '@mongodb-js/compass-collection-stats';
import { activate as activateExplain } from '@mongodb-js/compass-explain-plan';
import { activate as activateIndexes } from '@mongodb-js/compass-indexes';
import { activate as activateQueryBar } from '@mongodb-js/compass-query-bar';
import { activate as activateValidation } from '@mongodb-js/compass-schema-validation';
import { activate as activateSchema } from '@mongodb-js/compass-schema';

// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'bootstrap/less/bootstrap.less';
import 'less/index.less';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;
global.hadronApp.isFeatureEnabled = () => { return false; };

const instance = {
  build: {
    version: '4.2.0'
  }
};

app.instance = instance;

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
activateCrud(appRegistry);
activateAgg(appRegistry);
activateDA(appRegistry);
activateStats(appRegistry);
activateQueryBar(appRegistry);
activateExplain(appRegistry);
activateIndexes(appRegistry);
activateSchema(appRegistry);
activateValidation(appRegistry);
appRegistry.onActivated();

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

// For initialization events to happen in isolation, uncomment the
// following lines as needed in the same places they are commented out.
//
// // Application was initialized.
// appRegistry.emit('application-initialized', '1.11.0-dev');

// Render our plugin - don't remove the following line.
render(CollectionPlugin);

// // Data service initialization and connection.
import Connection from 'mongodb-connection-model';
import DataService from 'mongodb-data-service';

const connection = new Connection({
  hostname: '127.0.0.1',
  port: 27017,
  ns: 'databaseName',
  mongodb_database_name: 'admin'
});
const dataService = new DataService(connection);

appRegistry.emit('data-service-initialized', dataService);
dataService.connect((error, ds) => {
  appRegistry.emit('data-service-connected', error, ds);
  appRegistry.emit('server-version-changed', '4.2.0');
  appRegistry.emit('open-namespace-in-new-tab', 'echo.bandsReadonly', true, 'echo.bands');
  appRegistry.emit('open-namespace-in-new-tab', 'echo.artists', false);
  appRegistry.emit('select-namespace', 'echo.bands', false);
  // appRegistry.emit('open-namespace-in-new-tab', 'thisisaverylongdatabase.andcollectionname');
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
    render(CollectionPlugin);
  });
}
