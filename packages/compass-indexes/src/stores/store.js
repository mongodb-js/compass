import { createStore, applyMiddleware } from 'redux';
import reducer from 'modules';
import thunk from 'redux-thunk';
import toNS from 'mongodb-ns';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated
} from 'mongodb-redux-common/app-registry';
import { writeStateChanged } from 'modules/is-writable';
import { readonlyViewChanged } from 'modules/is-readonly-view';
import { getDescription } from 'modules/description';
import { dataServiceConnected } from 'modules/data-service';
import { loadIndexesFromDb, parseErrorMsg } from 'modules/indexes';
import { handleError } from 'modules/error';

const debug = require('debug')('mongodb-compass:stores:IndexesStore');

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
  }
};

const configureStore = (options = {}) => {
  const store = createStore(reducer, applyMiddleware(thunk));

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;
    store.dispatch(localAppRegistryActivated(localAppRegistry));

    localAppRegistry.on('refresh-data', () => {
      store.dispatch(loadIndexesFromDb(options.namespace));
    });
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));

    globalAppRegistry.getStore('DeploymentAwareness.WriteStateStore').listen((state) => {
      store.dispatch(writeStateChanged(state.isWritable));
      store.dispatch(getDescription(state.description));
    });
  }

  // Set the data provider - this must happen second.
  if (options.dataProvider) {
    setDataProvider(store, options.dataProvider.error, options.dataProvider.dataProvider);
  }

  // Set the namespace - must happen third.
  if (options.namespace) {
    const isReadonlyView = options.isReadonly;
    store.dispatch(readonlyViewChanged(isReadonlyView));
    store.dispatch(loadIndexesFromDb(options.namespace));
  }

  store.subscribe(() => {
    const state = store.getState();
    debug('IndexesStore changed to', state);
  });

  return store;
};

export default configureStore;
