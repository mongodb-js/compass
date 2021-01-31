import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import CompassSchemaPlugin, { activate } from 'plugin';
import { activate as activateQueryBar } from '@mongodb-js/compass-query-bar';
import StatusPlugin, { activate as activateStatus } from '@mongodb-js/compass-status';
import configureStore, { setDataProvider, setNamespace } from 'stores';
import configureActions from 'actions';

// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'bootstrap/less/bootstrap.less';
import 'less/index.less';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;
global.hadronApp.isFeatureEnabled = () => { return true; };

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
activateStatus(appRegistry);
appRegistry.onActivated();

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.id = 'root';
root.style = 'height: 100vh';
document.body.appendChild(root);

import Connection from 'mongodb-connection-model';
import DataService from 'mongodb-data-service';

const localAppRegistry = new AppRegistry();

activateQueryBar(localAppRegistry);

const queryBarRole = localAppRegistry.getRole('Query.QueryBar')[0];
const queryBarActions = queryBarRole.configureActions();
const queryBarStore = queryBarRole.configureStore({
  localAppRegistry: localAppRegistry,
  serverVersion: '4.2.0',
  actions: queryBarActions
});
localAppRegistry.registerStore(queryBarRole.storeName, queryBarStore);
localAppRegistry.registerAction(queryBarRole.actionName, queryBarActions);

const actions = configureActions();
const store = configureStore({
  localAppRegistry: localAppRegistry,
  globalAppRegistry: appRegistry,
  actions: actions
});

// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StatusPlugin />
        <Component store={store} actions={actions} />
      </div>
    </AppContainer>,
    document.getElementById('root')
  );
};

const url = process.env.COMPASS_SCHEMA_DEV_MONGODB_URL || 'mongodb://localhost:27017';
const namespace = process.env.COMPASS_SCHEMA_DEV_NAMESPACE || 'test.test';
Connection.from(url, (err, connection) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error('Connection to', url, 'failed', err);
    process.exit(1);
  }

  const dataService = new DataService(connection);
  dataService.connect((error, ds) => {
    setDataProvider(store, error, ds);
    setNamespace(store, namespace);

    render(CompassSchemaPlugin);
  });
});

if (module.hot) {
  /**
   * Warning from React Router, caused by react-hot-loader.
   * The warning can be safely ignored, so filter it from the console.
   * Otherwise you'll see it every time something changes.
   * See https://github.com/gaearon/react-hot-loader/issues/298
   */
  // const orgError = console.error; // eslint-disable-line no-console
  // console.error = (message) => { // eslint-disable-line no-console
  //   if (message && message.indexOf('You cannot change <Router routes>;') === -1) {
  //     // Log the error as normally
  //     orgError.apply(console, [message]);
  //   }
  // };

  module.hot.accept('plugin', () => {
    // Because Webpack 2 has built-in support for ES2015 modules,
    // you won't need to re-require your app root in module.hot.accept
    render(CompassSchemaPlugin);
  });
}
