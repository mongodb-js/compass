import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from '../modules/drop-index';
import { dataServiceConnected } from '../modules/data-service';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import { handleError } from '../modules/drop-index/error';
import { toggleIsVisible } from '../modules/is-visible';
import { nameChanged } from '../modules/drop-index/name';
import { namespaceChanged } from '../modules/namespace';

/**
 * Handle setting up the data provider.
 *
 * @param {Object} store - The store.
 * @param {Object} error - The error.
 * @param {Object} provider - The provider.
 */
export const setDataProvider = (store, error, provider) => {
  if (error !== null) {
    store.dispatch(handleError(error.message));
  } else {
    store.dispatch(dataServiceConnected(provider));
  }
};

const configureStore = (options = {}) => {
  const store = createStore(reducer, applyMiddleware(thunk));

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;
    store.dispatch(localAppRegistryActivated(localAppRegistry));

    localAppRegistry.on('toggle-drop-index-modal', (isVisible, indexName) => {
      store.dispatch(nameChanged(indexName));
      store.dispatch(toggleIsVisible(isVisible));
    });

    localAppRegistry.on('data-service-connected', (error, ds) => {
      setDataProvider(store, error, ds);
    });
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));
  }

  if (options.namespace) {
    store.dispatch(namespaceChanged(options.namespace));
  }

  // Set the data provider - this must happen last.
  if (options.dataProvider) {
    setDataProvider(
      store,
      options.dataProvider.error,
      options.dataProvider.dataProvider
    );
  }

  return store;
};

export default configureStore;
