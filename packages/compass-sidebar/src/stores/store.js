import { createStore, applyMiddleware } from 'redux';
import reducer from '../modules';
import thunk from 'redux-thunk';
import { globalAppRegistryActivated } from 'mongodb-redux-common/app-registry';

import { changeInstance } from '../modules/instance';
import { filterDatabases } from '../modules/databases';
import { reset } from '../modules/reset';
import { toggleIsWritable } from '../modules/is-writable';
import { changeDescription } from '../modules/description';
import { toggleIsDataLake } from '../modules/is-data-lake';
import { loadDetailsPlugins } from '../modules/details-plugins';
import { toggleIsGenuineMongoDB } from '../modules/is-genuine-mongodb';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import { changeConnection } from '../modules/connection-model';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  store.dispatch(globalAppRegistryActivated(appRegistry));
  store.dispatch(loadDetailsPlugins(appRegistry));

  appRegistry.on('data-service-connected', (_, dataService) => {
    store.dispatch(changeConnection(dataService.client.model));
  });

  appRegistry.on('instance-refreshed', (state) => {
    store.dispatch(changeInstance(state.instance));
    store.dispatch(filterDatabases(null, state.instance.databases, null));
    if (state.instance.dataLake && state.instance.dataLake.isDataLake) {
      store.dispatch(toggleIsDataLake(true));
    }
    const isGenuine = state.instance.genuineMongoDB === undefined || state.instance.genuineMongoDB.isGenuine === undefined ?
      true :
      state.instance.genuineMongoDB.isGenuine;

    store.dispatch(toggleIsGenuineMongoDB(!!isGenuine));
    store.dispatch(toggleIsGenuineMongoDBVisible(!isGenuine));
  });

  appRegistry.getStore('DeploymentAwareness.WriteStateStore').listen((state) => {
    store.dispatch(toggleIsWritable(state.isWritable));
    store.dispatch(changeDescription(state.description));
  });

  appRegistry.on('select-namespace', (metadata) => {
    store.dispatch(filterDatabases(null, null, metadata.namespace || ''));
  });

  appRegistry.on('open-namespace-in-new-tab', (metadata) => {
    store.dispatch(filterDatabases(null, null, metadata.namespace || ''));
  });

  appRegistry.on('select-database', (ns) => {
    store.dispatch(filterDatabases(null, null, ns || ''));
  });

  appRegistry.on('data-service-disconnected', () => {
    store.dispatch(reset());
    // @todo: Set the connection name.
  });
};

export default store;
