import { createStore, applyMiddleware } from 'redux';
import reducer from 'modules';
import thunk from 'redux-thunk';

import { changeInstance } from 'modules/instance';
import { filterDatabases } from 'modules/databases';
import { reset } from 'modules/reset';
import { toggleIsWritable } from 'modules/is-writable';
import { changeDescription } from 'modules/description';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  appRegistry.on('instance-refreshed', (state) => {
    store.dispatch(changeInstance(state.instance));
    store.dispatch(filterDatabases(null, state.instance.databases, null));
  });

  appRegistry.getStore('DeploymentAwareness.WriteStateStore').listen((state) => {
    store.dispatch(toggleIsWritable(state.isWritable));
    store.dispatch(changeDescription(state.description));
  });

  appRegistry.on('collection-changed', (ns) => {
    store.dispatch(filterDatabases(null, null, ns || ''));
  });

  appRegistry.on('database-changed', (ns) => {
    store.dispatch(filterDatabases(null, null, ns || ''));
  });

  appRegistry.on('data-service-disconnected', () => {
    store.dispatch(reset());
  });
};


export default store;
