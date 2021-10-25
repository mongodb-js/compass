import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { ipcRenderer } from 'electron';

import reducer from '../modules';
import {
  dataServiceConnected,
  appRegistryActivated,
  globalAppRegistryActivated,
  nsChanged
} from '../modules/compass';
import { openExport, queryChanged } from '../modules/export';
import { createLoggerAndTelemetry } from '../utils/logger';

const debug = createLoggerAndTelemetry('export-store');

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

    appRegistry.on('query-applied', query => {
      debug('dispatching query changed for query-applied app registry event');
      store.dispatch(queryChanged(query));
    });
    appRegistry.on('open-export', (count) => store.dispatch(openExport(count)));
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
  }

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers.
    // https://github.com/reactjs/react-redux/releases/tag/v2.0.0
    module.hot.accept('../modules', () => {
      const nextRootReducer = require('../modules');
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
};

export default configureStore;
