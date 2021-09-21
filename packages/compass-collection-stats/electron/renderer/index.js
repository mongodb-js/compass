// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'mongodb-compass/src/app/styles/index.less';

import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import Reflux from 'reflux';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import CollectionStatsPlugin, { activate } from '../../src/index.js';
import configureStore, { setNamespace, setDataProvider } from '../../src/stores';

const NS = 'echo.artists';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

const NamespaceStore = Reflux.createStore({
  init() {
    this.ns = NS;
  }
});

const CollectionStore = Reflux.createStore({
  isReadonly() {
    return false;
  }
});

const CrudActions = Reflux.createActions([
  'documentRemoved'
]);

appRegistry.registerStore('App.NamespaceStore', NamespaceStore);
appRegistry.registerStore('App.CollectionStore', CollectionStore);
appRegistry.registerAction('CRUD.Actions', CrudActions);

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
appRegistry.onActivated();

const store = configureStore({
  localAppRegistry: appRegistry,
  isReadonly: false
});

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

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
render(CollectionStatsPlugin);

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

dataService.connect((error, ds) => {
  setDataProvider(store, error, ds);
  setNamespace(store, NS);
});

// For automatic switching to specific namespaces, uncomment below as needed.
// appRegistry.emit('database-changed', 'database');

// For plugins based on query execution, comment out below:
// const query = {
//   filter: { name: 'testing' },
//   project: { name: 1 },
//   sort: { name: -1 },
//   skip: 0,
//   limit: 20,
//   ns: 'database.collection'
// }
// appRegistry.emit('query-applied', query);

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

  module.hot.accept('../../src/index.js', () => {
    // Because Webpack 2 has built-in support for ES2015 modules,
    // you won't need to re-require your app root in module.hot.accept
    render(CollectionStatsPlugin);
  });
}
