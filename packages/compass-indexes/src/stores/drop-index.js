import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from 'modules/drop-index';
import { dataServiceConnected } from 'modules/data-service';
import { appRegistryActivated} from 'modules/app-registry';
import { parseErrorMsg } from 'modules/indexes';
import { handleError } from 'modules/error';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  /**
   * Send appRegistry.
   */
  store.dispatch(appRegistryActivated(appRegistry));
  /**
   * Set the data service in the store when connected.
   *
   * @param {Error} error - The error.
   * @param {DataService} dataService - The data service.
   */
  appRegistry.on('data-service-connected', (error, dataService) => {
    if (error !== null) {
      store.dispatch(handleError(parseErrorMsg(error)));
    } else {
      store.dispatch(dataServiceConnected(dataService));
    }
  });
};

export default store;
