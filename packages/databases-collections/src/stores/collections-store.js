import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import find from 'lodash.find';
import { appRegistryActivated } from '../modules/app-registry';
import { changeDatabaseName } from '../modules/database-name';
import { dataServiceConnected } from '../modules/data-service';
import { loadCollectionStats } from '../modules/collections';
import { loadDatabases } from '../modules/databases';
import { writeStateChanged } from '../modules/is-writable';
import { toggleIsDataLake } from '../modules/is-data-lake';
import reducer from '../modules';

const store = createStore(reducer, applyMiddleware(thunk));

/**
 * Load all the collections.
 *
 * @param {String} databaseName - The current database name.
 * @param {Array} databases - The databases.
 */
const loadAll = (databaseName, databases) => {
  const database = find(databases, (db) => {
    console.log('looking for db db', databaseName);
    return db._id === databaseName;
  });
  if (database) {
    console.log('found db', database);
  }
  store.dispatch(changeDatabaseName(database ? databaseName : null));
  store.dispatch(loadCollectionStats(database ? database.collections : []));
};

store.onActivated = (appRegistry) => {
  /**
   * Sort the collections once the instance is refreshed.
   *
   * @param {Object} state - The instance store state.
   */
  appRegistry.on('instance-refreshed', (state) => {
    const storeState = store.getState();
    const databaseName = storeState.databaseName;
    if (state.instance.databases) {
      const databases = state.instance.databases.models;
      store.dispatch(loadDatabases(databases));
      if (databaseName) {
        loadAll(databaseName, databases);
      }
    }
    if (state.instance.dataLake && state.instance.dataLake.isDataLake) {
      store.dispatch(toggleIsDataLake(true));
    }
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
   * Set the data service in the store when connected.
   *
   * @param {Error} error - The error.
   * @param {DataService} dataService - The data service.
   */
  appRegistry.on('data-service-connected', (error, dataService) => {
    store.dispatch(dataServiceConnected(error, dataService));
  });

  /**
   * When the database changes load the collections.
   *
   * @param {String} ns - The namespace.
   */
  appRegistry.on('select-database', (ns) => {
    const state = store.getState();
    const databaseName = state.databaseName;
    if (ns && !ns.includes('.') && ns !== databaseName) {
      loadAll(ns, state.databases);
    }
  });

  /**
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
