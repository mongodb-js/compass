import { createStore, applyMiddleware } from 'redux';
import reducer from 'modules';
import thunk from 'redux-thunk';

import { changeInstance } from 'modules/instance';
import { toggleIsDblistExpanded } from 'modules/is-dblist-expanded';
import { filterDatabases } from 'modules/databases';
import { changeFilterRegex } from 'modules/filter-regex';
import { reset } from 'modules/reset';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  appRegistry.getStore('App.InstanceStore').listen((state) => {
    store.dispatch(changeInstance(state.instance));
    store.dispatch(filterDatabases(null, state.instance.databases, null));
  });

  appRegistry.on('collection-changed', (ns) => {
    store.dispatch(filterDatabases(null, null, ns || ''));
  });

  appRegistry.on('database-changed', (ns) => {
    store.dispatch(filterDatabases(null, null, ns || ''));
  });

  // appRegistry.on('refresh-data', () => {
  //   appRegistry.getAction('App.InstanceActions').refreshInstance();
  // });
  //
  // appRegistry.on('data-service-disconnected', () => {
  //   store.dispatch(reset());
  // });

  // appRegistry.on('filter-databases', (re) => {
  //   store.dispatch(changeFilterRegex(re));
  //   store.dispatch(toggleIsDblistExpanded());
  //   store.dispatch(filterDatabases(re, null));
  //   store.dispatch(changeExpandedDblist());
  // });
};


export default store;
