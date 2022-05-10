import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { dataServiceConnected, dataServiceUpdated } from '../modules/data-service';
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
    if (dataService) {
      dataService.on('topologyDescriptionChanged', () => {
        store.dispatch(dataServiceUpdated(dataService));
      });
    }
  });

  appRegistry.on('server-version-changed', (version) => {
    store.dispatch(serverVersionChanged(version));
  });

  /**
   * When needing to create a collection from elsewhere, the app registry
   * event is emitted.
   *
   * @param {{ database: string }} ns Parsed namespace
   */
  appRegistry.on('open-create-collection', ({ database }) => {
    store.dispatch(open(database));
  });
};

export default store;
