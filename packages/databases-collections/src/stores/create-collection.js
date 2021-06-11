import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { dataServiceConnected } from '../modules/data-service';
import { serverVersionChanged } from '../modules/server-version';
import reducer, { open } from '../modules/create-collection';

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

  appRegistry.on('server-version-changed', (version) => {
    store.dispatch(serverVersionChanged(version));
  });

  /**
   * When needing to create a collection from elsewhere, the app registry
   * event is emitted.
   *
   * @param {String} databaseName - The database name.
   */
  appRegistry.on('open-create-collection', (databaseName) => {
    store.dispatch(open(databaseName));
  });
};

export default store;
