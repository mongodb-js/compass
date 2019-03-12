import { createStore, applyMiddleware } from 'redux';
import reducer from 'modules';
import thunk from 'redux-thunk';
import toNS from 'mongodb-ns';

import { writeStateChanged } from 'modules/is-writable';
import { readonlyViewChanged } from 'modules/is-readonly-view';
import { getDescription } from 'modules/description';
import { appRegistryActivated} from 'modules/app-registry';
import { dataServiceConnected } from 'modules/data-service';
import { loadIndexesFromDb, parseErrorMsg } from 'modules/indexes';
import { handleError } from 'modules/error';

const debug = require('debug')('mongodb-compass:stores:IndexesStore');

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  // Events emitted from the app registry:

  appRegistry.getStore('DeploymentAwareness.WriteStateStore').listen((state) => {
    store.dispatch(writeStateChanged(state.isWritable));
    store.dispatch(getDescription(state.description));
  });

  appRegistry.on('data-service-connected', (error, dataService) => {
    if (error !== null) {
      store.dispatch(handleError(parseErrorMsg(error)));
    } else {
      store.dispatch(dataServiceConnected(dataService));
    }
  });

  appRegistry.on('collection-changed', (ns) => {
    const namespace = toNS(ns);
    if (namespace.collection) {
      const isReadonlyView = appRegistry.getStore('App.CollectionStore').isReadonly();
      store.dispatch(readonlyViewChanged(isReadonlyView));
      store.dispatch(loadIndexesFromDb(ns));
    }
  });

  appRegistry.on('refresh-data', () => {
    const ns = appRegistry.getStore('App.NamespaceStore').ns;
    if (ns.indexOf('.') !== -1) {
      store.dispatch(loadIndexesFromDb(ns));
    }
  });

  /**
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

store.subscribe(() => {
  const state = store.getState();
  debug('IndexesStore changed to', state);
});

export default store;
