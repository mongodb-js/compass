import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { ipcRenderer } from 'electron';

import reducer from 'modules';

import {
  dataServiceConnected,
  appRegistryActivated,
  globalAppRegistryActivated,
  nsChanged
} from 'modules/compass';

import { openExport, queryChanged } from 'modules/export';
import { openImport } from 'modules/import';
import { statsReceived } from 'modules/stats';

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
  /**
   * The store has a combined reducer.
   */
  const store = createStore(reducer, applyMiddleware(thunk));

  /**
   * Called when the app registry is activated.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  if (options.localAppRegistry) {
    const appRegistry = options.localAppRegistry;
    store.dispatch(appRegistryActivated(appRegistry));

    appRegistry.on('query-applied', query =>
      store.dispatch(queryChanged(query))
    );
    appRegistry.on('open-import', () => store.dispatch(openImport()));
    appRegistry.on('open-export', () => store.dispatch(openExport()));
    appRegistry.getStore('CollectionStats.Store').listen(stats => {
      store.dispatch(statsReceived(stats));
    });
  }

  if (options.globalAppRegistry) {
    const appRegistry = options.globalAppRegistry;
    store.dispatch(globalAppRegistryActivated(appRegistry));
  }

  if (options.dataProvider) {
    setDataProvider(
      store,
      options.dataProvider.error,
      options.dataProvider.dataProvider
    );
  }

  if (options.namespace) {
    store.dispatch(nsChanged(options.namespace));
  }

  /**
   * TODO: Make this use `hadron-ipc`/"unified compass API".
   */
  if (ipcRenderer) {
    /**
     * Listen for compass:open-export messages.
     */
    ipcRenderer.on('compass:open-export', () => {
      store.dispatch(openExport());
    });

    /**
     * Listen for compass:open-import messages.
     */
    ipcRenderer.on('compass:open-import', () => {
      store.dispatch(openImport());
    });
  }

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers.
    // https://github.com/reactjs/react-redux/releases/tag/v2.0.0
    module.hot.accept('modules', () => {
      const nextRootReducer = require('../modules');
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
};

export default configureStore;
