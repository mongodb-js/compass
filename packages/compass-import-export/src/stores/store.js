import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';

import { rootReducer, rootEpic } from 'modules';

import { nsChanged } from 'modules/ns';
import { openExport } from 'modules/export';
import { openImport } from 'modules/import';
import { dataServiceConnected } from 'modules/data-service';
import { statsRecieved } from 'modules/stats';

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

if (module.hot) {
  // Enable Webpack hot module replacement for reducers
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
  appRegistry.on('open-export', (ns, query) => store.dispatch(openExport(query)));
  appRegistry.on('open-import', () => store.dispatch(openImport()));
  appRegistry.getStore('CollectionStats.Store').listen((stats) => {
    store.dispatch(statsRecieved(stats));
  });
};

export default store;
