import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { ipcRenderer } from 'hadron-ipc';

import reducer, { toggleStatus, setSearchTerm } from '../modules';

export function activatePlugin() {
  const store = createStore(reducer, applyMiddleware(thunk));

  const onAppFind = () => {
    if (store.getState().enabled) {
      void ipcRenderer?.call('app:stop-find-in-page', 'clearSelection');
      store.dispatch(setSearchTerm(''));
    }
    store.dispatch(toggleStatus());
  };

  ipcRenderer?.on('app:find', onAppFind);

  return {
    store,
    deactivate() {
      ipcRenderer?.off('app:find', onAppFind);
    },
  };
}
