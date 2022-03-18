import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { ipcRenderer } from 'hadron-ipc';

import reducer, { toggleStatus, setSearchTerm } from '../modules';

const _store = createStore(reducer, applyMiddleware(thunk));

// cmd-f in main app emits an ipc event to find results
const store = Object.assign(_store, {
  onActivated() {
    ipcRenderer.on('app:find', () => {
      if (store.getState().enabled) {
        void ipcRenderer.call('app:stop-find-in-page', 'clearSelection');
        store.dispatch(setSearchTerm(''));
        return store.dispatch(toggleStatus());
      }
      store.dispatch(toggleStatus());
    });
  },
});

export default store;
