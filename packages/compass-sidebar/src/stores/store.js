import { createStore, applyMiddleware } from 'redux';
import reducer from 'modules';
import thunk from 'redux-thunk';
import { globalAppRegistryActivated } from 'mongodb-redux-common/app-registry';

import { changeInstance } from 'modules/instance';
import { filterDatabases } from 'modules/databases';
import { reset } from 'modules/reset';
import { toggleIsWritable } from 'modules/is-writable';
import { changeDescription } from 'modules/description';
import { toggleIsDataLake } from 'modules/is-data-lake';
import { loadDetailsPlugins } from 'modules/details-plugins';
import { toggleIsGenuineMongoDB } from 'modules/is-genuine-mongodb';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  store.dispatch(globalAppRegistryActivated(appRegistry));
  store.dispatch(loadDetailsPlugins(appRegistry));

  appRegistry.on('instance-refreshed', (state) => {
    store.dispatch(changeInstance(state.instance));
    store.dispatch(filterDatabases(null, state.instance.databases, null));
    if (state.instance.dataLake && state.instance.dataLake.isDataLake) {
      store.dispatch(toggleIsDataLake(true));
    }
    const isGenuine = state.instance.genuineMongoDB === undefined ?
      true :
      state.instance.genuineMongoDB;

    store.dispatch(toggleIsGenuineMongoDB(isGenuine));
    // store.dispatch(toggleIsVisible(!isGenuine.isGenuine));
  });

  appRegistry.getStore('DeploymentAwareness.WriteStateStore').listen((state) => {
    store.dispatch(toggleIsWritable(state.isWritable));
    store.dispatch(changeDescription(state.description));
  });

  appRegistry.on('select-namespace', (ns) => {
    store.dispatch(filterDatabases(null, null, ns || ''));
  });

  appRegistry.on('open-namespace-in-new-tab', (ns) => {
    store.dispatch(filterDatabases(null, null, ns || ''));
  });

  appRegistry.on('select-database', (ns) => {
    store.dispatch(filterDatabases(null, null, ns || ''));
  });

  appRegistry.on('data-service-disconnected', () => {
    store.dispatch(reset());
  });
};

export default store;
