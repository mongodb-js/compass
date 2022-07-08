// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'mongodb-compass/src/app/styles/index.less';

import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import { activate } from '../../src/index.js';
import ConnectedDocumentList from '../../src/components/connected-document-list';
import { activate as activateQueryBar } from '@mongodb-js/compass-query-bar';
import configureStore, { setDataProvider } from '../../src/stores';
import configureActions from '../../src/actions';

window.jQuery = require('jquery');

const DB = 'echo';
const COLL = 'bands';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

// Activate our plugin with the Hadron App Registry
const QueryChangedStore = require('./stores/query-changed-store');
// TODO: remove
const TextWriteButton = require('./components/text-write-button');
const OptionWriteSelector = require('./components/option-write-selector');
appRegistry.registerStore('Query.ChangedStore', QueryChangedStore);
appRegistry.registerComponent('DeploymentAwareness.TextWriteButton', TextWriteButton);
appRegistry.registerComponent('DeploymentAwareness.OptionWriteSelector', OptionWriteSelector);

activate(appRegistry);
appRegistry.onActivated();

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.style = 'height: 100vh';
root.id = 'root';
document.body.appendChild(root);

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
  actions: actions,
  localAppRegistry: localAppRegistry,
  globalAppRegistry: appRegistry,
  namespace: `${DB}.${COLL}`,
  isReadonly: false,
  isTimeSeries: false
});

// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component store={store} actions={actions} />
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
render(ConnectedDocumentList);

// // Data service initialization and connection.
import Connection from 'mongodb-connection-model';
import { DataServiceImpl } from 'mongodb-data-service';

const connection = new Connection({
  hostname: '127.0.0.1',
  port: 27017,
  ns: DB,
  mongodb_database_name: 'admin'
});
const dataService = new DataServiceImpl(connection);

appRegistry.emit('data-service-initialized', dataService);

dataService.connect((error, ds) => {
  setDataProvider(store, error, ds);
  localAppRegistry.emit('query-changed', { ns: `${DB}.${COLL}` });

  // global.hadronApp.appRegistry.emit('instance-refreshed', { instance: {
  //   dataLake: {
  //     isDataLake: true, version: '2'
  //   },
  //   build: { version: '1' }
  // }});
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
    render(ConnectedDocumentList);
  });
}
