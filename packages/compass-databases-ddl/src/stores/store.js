import { createStore } from 'redux';
import { dataServiceConnected } from 'modules/data-service';
import { sortDatabases } from 'modules/databases';
import reducer from 'modules';

const store = createStore(reducer);

store.onActivated = (appRegistry) => {
  /**
   * Sort the databases once the instance is refreshed.
   *
   * @param {Object} state - The instance store state.
   */
  appRegistry.getStore('App.InstanceStore').listen((state) => {
    store.dispatch(sortDatabases(state.instance.databases));
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
};

export default store;
