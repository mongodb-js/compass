import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';


import HomePlugin, { activate } from 'plugin';
import { activate as aggregationsActivate } from '@mongodb-js/compass-aggregations';
import { activate as appActivate } from '@mongodb-js/compass-app-stores';
import { activate as collectionActivate } from '@mongodb-js/compass-collection';
import { activate as collectionStatsActivate } from '@mongodb-js/compass-collection-stats';
import { activate as collectionDDLActivate } from '@mongodb-js/compass-collections-ddl';
import { activate as connectActivate } from '@mongodb-js/compass-connect';
import { activate as crudActivate } from '@mongodb-js/compass-crud';
import { activate as databaseActivate } from '@mongodb-js/compass-database';
import { activate as databasesDDLActivate } from '@mongodb-js/compass-databases-ddl';
import { activate as daActivate } from '@mongodb-js/compass-deployment-awareness';
import { activate as exportToLangActivate } from '@mongodb-js/compass-export-to-language';
import { activate as fieldStoreActivate } from '@mongodb-js/compass-field-store';
import { activate as findInPageActivate } from '@mongodb-js/compass-find-in-page';
import { activate as importExportActivate } from '@mongodb-js/compass-import-export';
import { activate as indexesActivate } from '@mongodb-js/compass-indexes';
import { activate as instanceActivate } from '@mongodb-js/compass-instance';
import { activate as queryBarActivate } from '@mongodb-js/compass-query-bar';
import { activate as queryHistoryActivate } from '@mongodb-js/compass-query-history';
import { activate as schemaValidationActivate } from '@mongodb-js/compass-schema-validation';
import { activate as serverVersionActivate } from '@mongodb-js/compass-server-version';
import { activate as rtssActivate } from '@mongodb-js/compass-serverstats';
import { activate as sidebarActivate } from '@mongodb-js/compass-sidebar';
import { activate as sshTunnelStatusActivate } from '@mongodb-js/compass-ssh-tunnel-status';
import { activate as statusActivate } from '@mongodb-js/compass-status';
import MongoDBInstance from 'mongodb-instance-model';

// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'bootstrap/less/bootstrap.less';
import 'less/index.less';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;
global.hadronApp.instance = new MongoDBInstance();

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
aggregationsActivate(appRegistry);
appActivate(appRegistry);
collectionActivate(appRegistry);
collectionDDLActivate(appRegistry);
collectionStatsActivate(appRegistry);
connectActivate(appRegistry);
crudActivate(appRegistry);
databaseActivate(appRegistry);
databasesDDLActivate(appRegistry);
daActivate(appRegistry);
exportToLangActivate(appRegistry);
fieldStoreActivate(appRegistry);
findInPageActivate(appRegistry);
importExportActivate(appRegistry);
indexesActivate(appRegistry);
instanceActivate(appRegistry);
queryBarActivate(appRegistry);
queryHistoryActivate(appRegistry);
schemaValidationActivate(appRegistry);
serverVersionActivate(appRegistry);
sshTunnelStatusActivate(appRegistry);
statusActivate(appRegistry);
sidebarActivate(appRegistry);
rtssActivate(appRegistry);

appRegistry.onActivated();

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.id = 'root';
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
render(HomePlugin);

// // Data service initialization and connection.
import Connection from 'mongodb-connection-model';
import DataService from 'mongodb-data-service';

const connection = new Connection({
  hostname: '127.0.0.1',
  port: 27017
});
const dataService = new DataService(connection);

appRegistry.emit('data-service-initialized', dataService);
// dataService.connect((error, ds) => {
//   if (error) {
//     console.log(`ERROR OCCURRED ${error}`);
//   }
//   appRegistry.emit('data-service-connected', error, ds);
//   appRegistry.emit('collection-changed', 'database.collection');
//   appRegistry.emit('database-changed', 'database');
// });
// Uncomment to test as if data lake
// global.hadronApp.appRegistry.emit('instance-refreshed', { instance: {
//   dataLake: {
//     isDataLake: true, version: '1.0.0'
//   },
//   build: { version: 1 }
// }});

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
    render(HomePlugin);
  });
}
