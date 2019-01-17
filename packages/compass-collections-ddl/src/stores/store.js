import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import find from 'lodash.find';
import { appRegistryActivated } from 'modules/app-registry';
import { changeDatabaseName } from 'modules/database-name';
import { dataServiceConnected } from 'modules/data-service';
import { loadCollectionStats } from 'modules/collections';
import { loadDatabases } from 'modules/databases';
import { writeStateChanged } from 'modules/is-writable';
import reducer from 'modules';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  /**
   * Sort the collections once the instance is refreshed.
   *
   * @param {Object} state - The instance store state.
   */
  appRegistry.getStore('App.InstanceStore').listen((state) => {
    store.dispatch(loadDatabases(state.instance.databases));
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
  appRegistry.on('database-changed', (ns) => {
    const state = store.getState();
    const databaseName = state.databaseName;
    if (ns && !ns.includes('.') && ns !== databaseName) {
      const database = find(state.databases, (db) => {
        return db._id === ns;
      });
      store.dispatch(changeDatabaseName(ns));
      store.dispatch(loadCollectionStats(database.collections));
    }
  });

  /**
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
