// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'mongodb-compass/src/app/styles/index.less';

import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import AggregationsPlugin, { activate, CreateViewPlugin, DuplicateViewPlugin } from '../../src/index.js';
import configureStore, { setDataProvider, setNamespace } from '../../src/stores';
import configureCreateViewStore from '../../src/stores/create-view';
import ExportToLanguagePlugin, {
  configureStore as configureExportToLangStore
} from '@mongodb-js/compass-export-to-language';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
appRegistry.onActivated();

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.style = 'height: 100vh';
root.id = 'root';
document.body.appendChild(root);

// // Data service initialization and connection.
import Connection from 'mongodb-connection-model';
import { DataServiceImpl } from 'mongodb-data-service';

const localAppRegistry = new AppRegistry();
const store = configureStore({
  localAppRegistry: localAppRegistry,
  globalAppRegistry: appRegistry,
  serverVersion: '4.4.0',
  env: 'adl',
  isTimeSeries: false,
  isReadonly: false,
  sourceName: null,
  fields: [
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

const exportToLangStore = configureExportToLangStore({
  localAppRegistry: localAppRegistry
});

const createViewStore = configureCreateViewStore({
  localAppRegistry: localAppRegistry,
  globalAppRegistry: appRegistry
});

const connection = new Connection({
  hostname: '127.0.0.1',
  port: 27017,
  ns: 'admin'
});
const dataService = new DataServiceImpl(connection);

dataService.connect((error, ds) => {
  appRegistry.emit('data-service-connected', error, ds);
  setDataProvider(store, error, ds);
  setDataProvider(createViewStore, error, ds);
  setNamespace(store, 'echo.bands');
  // setViewSource(store, 'citibike.tripsOfShortDuration', [{ $match: { gender: 1 }}]);
});

// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Component store={store} />
      <CreateViewPlugin store={createViewStore} />
      <DuplicateViewPlugin />
      <ExportToLanguagePlugin store={exportToLangStore} />
    </div>,
    document.getElementById('root')
  );
};

// For initialization events to happen in isolation, uncomment the
// following lines as needed in the same places they are commented out.
//
// // Application was initialized.
// appRegistry.emit('application-initialized', '1.11.0-dev');

// Render our plugin - don't remove the following line.
render(AggregationsPlugin);

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

