import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated
} from 'mongodb-redux-common/app-registry';
import { dataServiceConnected } from 'modules/data-service';
import reducer, { open } from 'modules/create-view';

const debug = require('debug')('mongodb-aggregations:stores:create-view');

/**
 * Set the data provider.
 *
 * @param {Store} store - The store.
 * @param {Error} error - The error (if any) while connecting.
 * @param {Object} provider - The data provider.
 */
export const setDataProvider = (store, error, provider) => {
  store.dispatch(dataServiceConnected(error, provider));
};

const configureStore = (options = {}) => {
  const store = createStore(reducer, applyMiddleware(thunk));

  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;
    store.dispatch(localAppRegistryActivated(localAppRegistry));

    /**
     * When needing to create a view from elsewhere, the app registry
     * event is emitted.
     */
    localAppRegistry.on('open-create-view', (meta) => {
      debug('open-create-view', meta.source, meta.pipeline);
      store.dispatch(open(meta.source, meta.pipeline));
    });
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));
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
