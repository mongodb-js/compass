import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { dataServiceConnected } from 'modules/data-service';
import {
  globalAppRegistryActivated
} from 'mongodb-redux-common/app-registry';
import reducer, { open } from 'modules/create-view';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  store.dispatch(globalAppRegistryActivated(appRegistry));

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
   * Handle duplicate view actions.
   *
   * @param {String} source - The source.
   * @param {Array} pipeline - The pipeline.
   */
  appRegistry.on('duplicate-view', (source, pipeline) => {
    store.dispatch(open(source, pipeline));
  });
};

export default store;
