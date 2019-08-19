import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { appRegistryActivated } from 'modules/app-registry';
import { loadDatabases } from 'modules/databases';
import { writeStateChanged } from 'modules/is-writable';
import { toggleIsGenuineMongoDB } from 'modules/is-genuine-mongodb';
import { toggleIsDataLake } from 'modules/is-data-lake';
import reducer from 'modules';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  /**
   * Sort the databases once the instance is refreshed.
   *
   * @param {Object} state - The instance store state.
   */
  appRegistry.on('instance-refreshed', (state) => {
    const databases = state.instance.databases;
    if (databases) {
      store.dispatch(loadDatabases(databases));
    }
    const isGenuine = state.instance.genuineMongoDB === undefined ?
      true :
      state.instance.genuineMongoDB.isGenuine;

    if (state.instance.dataLake && state.instance.dataLake.isDataLake) {
      store.dispatch(toggleIsDataLake(true));
    }

    store.dispatch(toggleIsGenuineMongoDB(!!isGenuine));
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
