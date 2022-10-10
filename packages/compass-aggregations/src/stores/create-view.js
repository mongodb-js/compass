import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { dataServiceConnected } from '../modules/data-service';
import reducer, { open } from '../modules/create-view';

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
  const store = createStore(
    reducer,
    {
      appRegistry: {
        localAppRegistry: options.localAppRegistry ?? null,
        globalAppRegistry: options.globalAppRegistry ?? null
      },
      dataService: {
        error: options.dataProvider.error,
        dataService: options.dataProvider.dataProvider
      }
    },
    applyMiddleware(thunk)
  );

  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;

    /**
     * When needing to create a view from elsewhere, the app registry
     * event is emitted.
     */
    localAppRegistry.on('open-create-view', (meta) => {
      debug('open-create-view', meta.source, meta.pipeline);
      store.dispatch(open(meta.source, meta.pipeline, false));
    });
  }

  return store;
};

export default configureStore;
