import { inputExpressionChanged } from '../modules/input-expression';
import { modalOpenChanged } from '../modules/modal-open';
import { modeChanged } from '../modules/mode';
import { uriChanged } from '../modules/uri';
import { runTranspiler } from '../modules/run-transpiler';
import { copyToClipboardFnChanged } from '../modules/copy-to-clipboard';
import { namespaceChanged } from '../modules/namespace';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated
} from '@mongodb-js/mongodb-redux-common/app-registry';
import reducer from '../modules';
import ConnectionString from 'mongodb-connection-string-url';

/**
 * Set the custom copy to clipboard function.
 *
 * @param {Store} store - The store.
 * @param {Function} fn - The function.
 */
export const setCopyToClipboardFn = (store, fn) => {
  store.dispatch(copyToClipboardFnChanged(fn));
};

// TODO: replace this with state coming from the right layer.
// this kind of information should not be derived
// from dataService as it operates on a lower level,
// as a consequence here we have to remove the `appName` that only
// the dataService should be using.
function getCurrentlyConnectedUri(dataService) {
  let connectionStringUrl;

  try {
    connectionStringUrl = new ConnectionString(
      dataService.getConnectionOptions().connectionString
    );
  } catch (e) {
    return '<uri>';
  }

  if (
    /^mongodb compass/i.exec(
      connectionStringUrl.searchParams.get('appName') || ''
    )
  ) {
    connectionStringUrl.searchParams.delete('appName');
  }

  return connectionStringUrl.href;
}

/**
 * Set the data provider.
 *
 * @param {Store} store - The store.
 * @param {Error} error - The error (if any) while connecting.
 * @param {Object} dataService - The data provider.
 */
export const setDataProvider = (store, error, dataService) => {
  store.dispatch(uriChanged(getCurrentlyConnectedUri(dataService)));
};

/**
 * Set the namespace in the store.
 *
 * @param {Store} store - The store.
 * @param {String} ns - The namespace in "db.collection" format.
 */
export const setNamespace = (store, ns) => {
  store.dispatch(namespaceChanged(ns));
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
      const query = {};
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

  if (options.namespace) {
    setNamespace(store, options.namespace);
  }


  if (options.copyToClipboardFn) {
    store.dispatch(copyToClipboardFnChanged(options.copyToClipboardFn));
  }

  return store;
};

export default configureStore;
