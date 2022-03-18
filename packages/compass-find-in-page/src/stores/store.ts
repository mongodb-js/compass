import reducer, { toggleStatus, setSearchTerm } from '../modules';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

const store = createStore(reducer, applyMiddleware(thunk));

// cmd-f in main app emits an ipc event to find results
store.onActivated = () => {
  const ipc = require('hadron-ipc');

  ipc.on('app:find', () => {
    if (store.getState().enabled) {
      ipc.call('app:stop-find-in-page', 'clearSelection');
      store.dispatch(setSearchTerm(''));
      return store.dispatch(toggleStatus());
    }
    store.dispatch(toggleStatus());
  });
};

export default store;
