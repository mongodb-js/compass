import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';

import { rootReducer, rootEpic } from 'modules';

import { nsChanged } from 'modules/ns';
import { openExport, queryChanged } from 'modules/export';
import { openImport } from 'modules/import';
import { dataServiceConnected } from 'modules/data-service';
import { appRegistryActivated } from 'modules/app-registry';
import { statsReceived } from 'modules/stats';

import { ipcRenderer } from 'electron';

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
  const epicMiddleware = createEpicMiddleware(rootEpic);

  /**
   * The store has a combined reducer.
   */
  const store = createStore(
    rootReducer,
    applyMiddleware(
      epicMiddleware
    )
  );

  /**
   * Called when the app registry is activated.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  if (options.localAppRegistry) {
    const appRegistry = options.localAppRegistry;
    store.dispatch(appRegistryActivated(appRegistry));

    appRegistry.on('query-applied', (query) => store.dispatch(queryChanged(query)));
    appRegistry.on('open-import', () => store.dispatch(openImport()));
    appRegistry.on('open-export', () => store.dispatch(openExport()));
    appRegistry.getStore('CollectionStats.Store').listen((stats) => {
      store.dispatch(statsReceived(stats));
    });
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

  return store;
};

export default configureStore;
