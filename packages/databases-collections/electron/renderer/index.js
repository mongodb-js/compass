// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'mongodb-compass/src/app/styles/index.less';

/* eslint-disable no-console */
import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import { NamespaceStore } from 'mongodb-reflux-store';
import CollectionModel from 'mongodb-collection-model';

import { activate } from '../../src';
import CreateCollectionPlugin from '../../src/components/create-collection-plugin';
import DropCollectionPlugin from '../../src/components/drop-collection-plugin';
import CreateDatabasePlugin from '../../src/components/create-database-plugin';
import DropDatabasePlugin from '../../src/components/drop-database-plugin';
import DatabasesCollectionsPlugin from './components/databases-collections';
import CollectionStore from './mocks/collection-store';
// TODO: remove
import TextWriteButton from './mocks/text-write-button';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

appRegistry.registerStore('App.NamespaceStore', NamespaceStore);
appRegistry.registerStore('App.CollectionStore', CollectionStore);
appRegistry.registerComponent('DeploymentAwareness.TextWriteButton', TextWriteButton);

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
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
      <div>
        <Component />
        <CreateCollectionPlugin />
        <DropCollectionPlugin />
        <CreateDatabasePlugin />
        <DropDatabasePlugin />
      </div>
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
render(DatabasesCollectionsPlugin);

// Data service initialization and connection.
import Connection from 'mongodb-connection-model';
import { DataServiceImpl } from 'mongodb-data-service';

const connection = new Connection({
  hostname: 'localhost',
  port: 27017,
  ns: 'admin'
});

const dataService = new DataServiceImpl(connection);

appRegistry.emit('data-service-initialized', dataService);
dataService.connect((error, ds) => {
  appRegistry.emit('data-service-connected', error, ds);
  dataService.instance().then(
    (data) => {
      const dbs = data.databases;
      dbs.forEach((db) => {
        db.collections = db.collections
          .filter(({ name }) => name && !name.startsWith('system.'))
          .map((collection) => {
            return new CollectionModel(collection);
          });
      });

      appRegistry.emit('instance-refreshed', {
        instance: {
          databases: {
            // Mock the ampersand model result that the instance is mapped into.
            models: data.databases,
            map: (mappDbsFunc) => data.databases.map(mappDbsFunc),
          },
          genuineMongoDB: { isGenuine: true },
          dataLake: { isDataLake: false },
        },
      });

      dataService.client.client
        .db('admin')
        .command({ buildinfo: 1 }, (buildInfoError, info) => {
          if (buildInfoError) {
            console.log(buildInfoError);
            return;
          }

          appRegistry.emit('server-version-changed', info.version);
        });

      appRegistry.emit('select-database', 'test');
    },
    (err) => {
      if (err) {
        console.log(err);
        process.exit(1);
      }
    }
  );
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

  module.hot.accept('../../src/index.js', () => {
    // Because Webpack 2 has built-in support for ES2015 modules,
    // you won't need to re-require your app root in module.hot.accept
    render(DatabasesCollectionsPlugin);
  });
}
