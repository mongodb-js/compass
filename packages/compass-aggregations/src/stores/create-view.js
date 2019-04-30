import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { appRegistryActivated } from 'modules/app-registry';
import { dataServiceConnected } from 'modules/data-service';
import reducer, { open } from 'modules/create-view';

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
   * When needing to create a view from elsewhere, the app registry
   * event is emitted.
   */
  appRegistry.on('open-create-view', (source, pipeline) => {
    store.dispatch(open(source, pipeline));
  });
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
