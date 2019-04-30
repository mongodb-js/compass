import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { dataServiceConnected } from 'modules/data-service';
import reducer, { open } from 'modules/create-view';

const debug = require('debug')('mongodb-aggregations:stores:create-view');

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  debug('store.onActivated');
  /**
   * Set the data service in the store when connected.
   *
   * @param {Error} error - The error.
   * @param {DataService} dataService - The data service.
   */
  appRegistry.on('data-service-connected', (error, dataService) => {
    debug('data-service-connected', { error, dataService });
    store.dispatch(dataServiceConnected(error, dataService));
  });

  /**
   * When needing to create a view from elsewhere, the app registry
   * event is emitted.
   */
  appRegistry.on('open-create-view', (meta) => {
    debug('open-create-view', meta.source, meta.pipeline);
    store.dispatch(open(meta.source, meta.pipeline));
  });
};

export default store;
