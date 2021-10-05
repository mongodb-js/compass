// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'mongodb-compass/src/app/styles/index.less';

import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import LoadingPlugin, { configureStore, CHANGE_STATUS } from '../../src/index.js';

const appRegistry = new AppRegistry();

const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

const store = configureStore({ globalAppRegistry: appRegistry });

// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component store={store} />
    </AppContainer>,
    document.getElementById('root')
  );
};

const delayStatusChange = (status, time) => {
  setTimeout(() => {
    appRegistry.emit(CHANGE_STATUS, { status: status });
  }, time);
};

delayStatusChange('running migrations', 1000);
delayStatusChange('loading preferences', 2000);
delayStatusChange('loading plugins', 3000);

// For initialization events to happen in isolation, uncomment the
// following lines as needed in the same places they are commented out.
//
// // Application was initialized.
// appRegistry.emit('application-initialized', '1.11.0-dev');

// Render our plugin - don't remove the following line.
render(LoadingPlugin);

// // Data service initialization and connection.
// import Connection from 'mongodb-connection-model';
// import { DataService } from 'mongodb-data-service';
//
// const connection = new Connection({
//   hostname: '127.0.0.1',
//   port: 27017,
//   ns: 'databaseName',
//   mongodb_database_name: 'admin',
//   mongodb_username: '<user>',
//   mongodb_password: '<password>'
// });
// const dataService = new DataService(connection);
//
// appRegistry.emit('data-service-initialized', dataService);
// dataService.connect((error, ds) => {
//    appRegistry.emit('data-service-connected', error, ds);
//    For automatic switching to specific namespaces, uncomment below as needed.
//    appRegistry.emit('collection-changed', 'database.collection');
//    appRegistry.emit('database-changed', 'database');

//    For plugins based on query execution, comment out below:
//    const query = {
//      filter: { name: 'testing' },
//      project: { name: 1 },
//      sort: { name: -1 },
//      skip: 0,
//      limit: 20,
//      ns: 'database.collection'
//    }
//    appRegistry.emit('query-applied', query);
// });

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

  module.hot.accept('../../src/index.js', () => render(LoadingPlugin));
}
