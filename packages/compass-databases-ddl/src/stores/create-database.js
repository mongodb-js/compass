import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { dataServiceConnected } from 'modules/data-service';
import { toggleIsVisible } from 'modules/is-visible';
import reducer from 'modules/create-database';

const store = createStore(reducer, applyMiddleware(thunk));

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

  /**
   * When needing to create a database from elsewhere, the app registry
   * event is emitted.
   */
  appRegistry.on('open-create-database', () => {
    store.dispatch(toggleIsVisible(true));
  });
};

export default store;
