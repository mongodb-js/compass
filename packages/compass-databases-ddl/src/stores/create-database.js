import { createStore } from 'redux';
import { dataServiceConnected } from 'modules/data-service';
import reducer from 'modules/create-database';

const store = createStore(reducer);

store.onActivated = (appRegistry) => {
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
