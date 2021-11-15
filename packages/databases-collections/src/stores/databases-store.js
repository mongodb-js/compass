import throttle from 'lodash/throttle';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { appRegistryActivated } from '../modules/app-registry';
import { loadDatabases } from '../modules/databases/databases';
import { writeStateChanged } from '../modules/is-writable';
import { toggleIsGenuineMongoDB } from '../modules/is-genuine-mongodb';
import { toggleIsDataLake } from '../modules/is-data-lake';
import { databasesReducer } from '../modules';

const store = createStore(databasesReducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  const onDatabasesChange = throttle((dbs) => {
    store.dispatch(loadDatabases(dbs.toJSON()));
  }, 100);

  appRegistry.on('instance-destroyed', () => {
    onDatabasesChange.cancel();
  });

  /**
   * Sort the databases once the instance is refreshed.
   *
   * @param {Object} state - The instance store state.
   */
  appRegistry.on('instance-created', ({ instance }) => {
    onDatabasesChange(instance.databases);

    instance.genuineMongoDB.on('change:isGenuine', (model, newVal) => {
      store.dispatch(toggleIsGenuineMongoDB(newVal));
    });

    instance.dataLake.on('change:isDataLake', (model, newVal) => {
      store.dispatch(toggleIsDataLake(newVal));
    });

    instance.on('change:databasesStatus', () => {
      onDatabasesChange(instance.databases);
    });

    instance.on('change:databases.status', () => {
      onDatabasesChange(instance.databases);
    });

    instance.on('change:databases.collectionsLength', () => {
      onDatabasesChange(instance.databases);
    });
  });

  /**
   * When write state changes based on SDAM events we change the store state.
   *
   * @param {Object} state - The write state store state.
   */
  appRegistry.getStore('DeploymentAwareness.WriteStateStore').listen((state) => {
    store.dispatch(writeStateChanged(state));
  });

  /**
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
