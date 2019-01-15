import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { dataServiceConnected } from 'modules/data-service';
import { toggleIsVisible } from 'modules/is-visible';
import { reset } from 'modules/reset';
import { changeCollectionName } from 'modules/drop-collection/name';
import reducer from 'modules/drop-collection';

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
   * When needing to drop a collection from elsewhere, the app registry
   * event is emitted.
   *
   * @param {String} name - The collection name.
   */
  appRegistry.on('open-drop-collection', (name) => {
    store.dispatch(reset());
    store.dispatch(changeCollectionName(name));
    store.dispatch(toggleIsVisible(true));
  });
};

export default store;
