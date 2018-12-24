import { createStore } from 'redux';
import { sortDatabases } from 'modules/databases';
import reducer from 'modules';

const store = createStore(reducer);

store.onActivated = (appRegistry) => {
  appRegistry.getStore('App.InstanceStore').listen((state) => {
    // @todo: Need column, direction
    store.dispatch(sortDatabases(state.instance.databases));
  });
};

export default store;
