import { createStore, applyMiddleware } from 'redux';
import reducer from 'modules';
import thunk from 'redux-thunk';

import { writeStateChanged } from 'modules/is-writable';
import { readStateChanged } from 'modules/is-readonly';
import { getDescription } from 'modules/description';
import { appRegistryActivated} from 'modules/app-registry';
import { dataServiceConnected } from 'modules/data-service';
import { loadIndexesFromDb, parseErrorMsg } from 'modules/indexes';
import { handleError } from 'modules/error';

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

  appRegistry.on('query-changed', (query) => {
    const cs = appRegistry.getStore('App.CollectionStore').isReadonly();
    store.dispatch(readStateChanged(process.env.HADRON_READONLY === 'true' || cs === true));
    store.dispatch(loadIndexesFromDb(query.ns));
  });

  appRegistry.on('refresh-data', () => {
    const cs = appRegistry.getStore('App.CollectionStore').isReadonly();
    store.dispatch(readStateChanged(process.env.HADRON_READONLY === 'true' || cs === true));

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


export default store;
