import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';

import { rootReducer, rootEpic } from 'modules';

import { nsChanged } from 'modules/ns';
import { openExport, queryChanged } from 'modules/export';
import { openImport } from 'modules/import';
import { dataServiceConnected } from 'modules/data-service';
import { statsReceived } from 'modules/stats';

import { ipcRenderer } from 'electron';

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

// Enable Webpack hot module replacement for reducers
if (module.hot) {
  module.hot.accept('../modules', () => {
    const { rootReducer: nextRootReducer, rootEpic: nextRootEpic } = require('../modules');
    store.replaceReducer(nextRootReducer);
    epicMiddleware.replaceEpic(nextRootEpic);
  });
}

/**
 * Called when the app registry is activated.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
store.onActivated = (appRegistry) => {
  appRegistry.on('collection-changed', ns => store.dispatch(nsChanged(ns)));
  appRegistry.on('data-service-connected', (err, ds) => store.dispatch(dataServiceConnected(err, ds)));
  appRegistry.on('query-applied', (query) => store.dispatch(queryChanged(query)));
  appRegistry.on('open-import', () => store.dispatch(openImport()));
  appRegistry.on('open-export', () => store.dispatch(openExport()));
  appRegistry.getStore('CollectionStats.Store').listen((stats) => {
    store.dispatch(statsReceived(stats));
  });
};

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
export default store;
