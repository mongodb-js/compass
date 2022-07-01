import throttle from 'lodash/throttle';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { appRegistryActivated } from '../modules/app-registry';
import { setDatabases } from '../modules/databases/databases';
import { databasesStatusChanged } from '../modules/databases/status';
import { writeStateChanged } from '../modules/is-writable';
import { toggleIsGenuineMongoDB } from '../modules/is-genuine-mongodb';
import { toggleIsDataLake } from '../modules/is-data-lake';
import { reset } from '../modules/reset';
import { databasesReducer } from '../modules';

const store = createStore(databasesReducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  const onDatabasesChange = throttle((dbs) => {
    store.dispatch(setDatabases(dbs.toJSON()));
  }, 300);

  appRegistry.on('instance-destroyed', () => {
    onDatabasesChange.cancel();
    store.dispatch(reset());
  });

  /**
   * Sort the databases once the instance is refreshed.
   *
   * @param {Object} state - The instance store state.
   */
  appRegistry.on('instance-created', ({ instance }) => {
    store.dispatch(databasesStatusChanged(instance));
    onDatabasesChange(instance.databases);

    store.dispatch(toggleIsGenuineMongoDB(instance.genuineMongoDB.isGenuine));

    instance.genuineMongoDB.on('change:isGenuine', (model, newVal) => {
      store.dispatch(toggleIsGenuineMongoDB(newVal));
    });

    store.dispatch(toggleIsDataLake(instance.dataLake.isDataLake));

    instance.dataLake.on('change:isDataLake', (model, newVal) => {
      store.dispatch(toggleIsDataLake(newVal));
    });

    store.dispatch(databasesStatusChanged(instance.databasesStatus));

    instance.on('change:databasesStatus', () => {
      store.dispatch(databasesStatusChanged(instance));
      onDatabasesChange(instance.databases);
    });

    onDatabasesChange(instance.databases);

    instance.on('change:databases.status', () => {
      onDatabasesChange(instance.databases);
    });
  });

  /**
   * When write state changes based on SDAM events we change the store state.
   *
   * @param {Object} state - The write state store state.
   */
  // TODO: change with something
  appRegistry.getStore('DeploymentAwareness.WriteStateStore').listen((state) => {
    store.dispatch(writeStateChanged(state));
  });

  /**
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
