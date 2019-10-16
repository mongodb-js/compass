import { inputExpressionChanged } from 'modules/input-expression';
import { modalOpenChanged } from 'modules/modal-open';
import { modeChanged } from 'modules/mode';
import { uriChanged } from 'modules/uri';
import { runTranspiler } from 'modules';
import { copyToClipboardFnChanged } from 'modules/copy-to-clipboard';
import { namespaceChanged } from 'modules/namespace';
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
      store.dispatch(modeChanged('Pipeline'));
      store.dispatch(modalOpenChanged(true));
      store.dispatch(runTranspiler({ aggregation: aggregation }));
      store.dispatch(inputExpressionChanged({ aggregation: aggregation }));
    });

    localAppRegistry.on('open-query-export-to-language', (queryStrings) => {
      let query = {};
      if (typeof queryStrings === 'string') {
        query.filter = queryStrings === '' ? '{}' : queryStrings;
      } else {
        [
          'filter',
          'project',
          'sort',
          'collation',
          'skip',
          'limit',
          'maxTimeMS'
        ].forEach((k) => {
          if (!queryStrings[k] || queryStrings[k] === '') {
            if (k === 'filter') {
              query[k] = '{}';
            }
          } else {
            query[k] = queryStrings[k];
          }
        });
      }

      store.dispatch(modeChanged('Query'));
      store.dispatch(modalOpenChanged(true));
      store.dispatch(runTranspiler(query));
      store.dispatch(inputExpressionChanged(query));
    });

    localAppRegistry.on('data-service-initialized', (dataService) => {
      store.dispatch(uriChanged(dataService.client.model.driverUrl));
    });

    localAppRegistry.on('collection-changed', (ns) => {
      store.dispatch(namespaceChanged(ns));
    });

    localAppRegistry.on('database-changed', (ns) => {
      store.dispatch(namespaceChanged(ns));
    });

  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));
  }

  if (options.copyToClipboardFn) {
    store.dispatch(copyToClipboardFnChanged(options.copyToClipboardFn));
  }

  return store;
};

export default configureStore;
