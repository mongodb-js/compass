import {
  addInputQuery,
  toggleModal,
  setNamespace,
  runQuery,
  copyToClipboardFnChanged
} from 'modules/export-query';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated
} from 'mongodb-redux-common/app-registry';
import reducer from 'modules';

/**
 * Set the custom copy to clipboard function.
 *
 * @param {Store} store - The store.
 * @param {Function} fn - The function.
 */
export const setCopyToClipboardFn = (store, fn) => {
  store.dispatch(copyToClipboardFnChanged(fn));
};

/**
 * Configure the store for use.
 *
 * @param {Object} options - The options.
 *
 * @returns {Store} The store.
 */
const configureStore = (options = {}) => {
  const store = createStore(reducer, applyMiddleware(thunk));

  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;
    store.dispatch(localAppRegistryActivated(localAppRegistry));
    localAppRegistry.on('open-aggregation-export-to-language', (aggregation) => {
      store.dispatch(toggleModal(true));
      store.dispatch(setNamespace('Pipeline'));
      store.dispatch(runQuery('python', aggregation));
      store.dispatch(addInputQuery(aggregation));
    });

    localAppRegistry.on('open-query-export-to-language', (query) => {
      store.dispatch(toggleModal(true));
      store.dispatch(setNamespace('Query'));
      store.dispatch(runQuery('python', query));
      store.dispatch(addInputQuery(query));
    });
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));
  }

  if (options.copyToClipboardFn) {
    setCopyToClipboardFn(store, options.copyToClipboardFn);
  }

  return store;
};

export default configureStore;
