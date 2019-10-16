/* eslint-disable no-console */
/* eslint-disable no-var */

require('debug').enable('mongo*');

import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import { activate } from 'plugin';
import ImportExportPlugin from './components/import-export';
import configureStore, { setDataProvider } from 'stores';
import { activate as activateStats } from '@mongodb-js/compass-collection-stats';

// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'less/global.less';

/**
 * Customize data service for your sandbox.
 */
const NS = 'test.people_imported';

import Connection from 'mongodb-connection-model';
const connection = new Connection({
  hostname: '127.0.0.1',
  port: 27017
});

/**
 * Plugins based on query execution can customize
 * the top-level state the sandbox will use.
 *
 * @example
 * ```javascript
 * var QUERY_BAR = {
 *   filter: { name: 'testing' },
 *   project: { name: 1 },
 *   sort: [[ name, -1 ]],
 *   skip: 0,
 *   limit: 20,
 *   ns: NS
 * };
 * ```
 */
var QUERY_BAR = {
  filter: {}
};

console.group('Compass Plugin Sandbox');
console.log('db.collection', NS);
console.log('connect', connection.driver_url, {
  options: connection.driver_options
});
console.groupEnd();

function onDataServiceConnected(_registry) {
  _registry.emit('query-applied', QUERY_BAR);
}

const appRegistry = new AppRegistry();
global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
activateStats(appRegistry);
appRegistry.onActivated();

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

const localAppRegistry = new AppRegistry();
const store = configureStore({
  namespace: NS,
  localAppRegistry: localAppRegistry
});

// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component store={store} appRegistry={localAppRegistry} />
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
render(ImportExportPlugin);

// // Data service initialization and connection.
import DataService from 'mongodb-data-service';
const dataService = new DataService(connection);

dataService.connect((error, ds) => {
  setDataProvider(store, error, ds);
  onDataServiceConnected(localAppRegistry);
});

// For automatic switching to specific namespaces, uncomment below as needed.

// appRegistry.emit('database-changed', 'database');

if (module.hot) {
  /**
   * Warning from React Router, caused by react-hot-loader.
   * The warning can be safely ignored, so filter it from the console.
   * Otherwise you'll see it every time something changes.
   * See https://github.com/gaearon/react-hot-loader/issues/298
   */

  module.hot.accept('plugin', () => {
    // Because Webpack 2 has built-in support for ES2015 modules,
    // you won't need to re-require your app root in module.hot.accept
    render(ImportExportPlugin);
  });
}
