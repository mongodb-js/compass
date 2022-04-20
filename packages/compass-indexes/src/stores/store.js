import { createStore, applyMiddleware } from 'redux';
import reducer from '../modules';
import thunk from 'redux-thunk';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import { writeStateChanged } from '../modules/is-writable';
import { readonlyViewChanged } from '../modules/is-readonly-view';
import { getDescription } from '../modules/description';
import { dataServiceConnected } from '../modules/data-service';
import { loadIndexesFromDb, parseErrorMsg } from '../modules/indexes';
import { handleError } from '../modules/error';
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
    store.dispatch(handleError(parseErrorMsg(error)));
  } else {
    store.dispatch(dataServiceConnected(provider));
    store.dispatch(loadIndexesFromDb());
  }
};

const configureStore = (options = {}) => {
  const store = createStore(reducer, applyMiddleware(thunk));

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;
    store.dispatch(localAppRegistryActivated(localAppRegistry));

    localAppRegistry.on('refresh-data', () => {
      store.dispatch(loadIndexesFromDb());
    });
    // TODO: could save the version to check for wildcard indexes
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));

    globalAppRegistry
      .getStore('DeploymentAwareness.WriteStateStore')
      .listen((state) => {
        store.dispatch(writeStateChanged(state.isWritable));
        store.dispatch(getDescription(state.description));
      });

    globalAppRegistry.on('refresh-data', () => {
      store.dispatch(loadIndexesFromDb());
    });
  }

  if (options.namespace) {
    store.dispatch(namespaceChanged(options.namespace));
  }

  if (options.isReadonly) {
    const isReadonlyView = options.isReadonly;
    store.dispatch(readonlyViewChanged(isReadonlyView));
  }

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
