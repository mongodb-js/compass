import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, { updateAvailable, initAutoUpdates, toggleAutoUpdates } from '../modules';
import { preferencesIpc } from 'compass-preferences-model';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = () => {
  try {
    const ipc = require('hadron-ipc');

    /**
     * Update available.
     */
    ipc.on('app:update-available', (_, opts) => {
      store.dispatch(updateAvailable(opts.releaseVersion));
    });

    /**
     * Listen to changes in preferences.
     */
    store.dispatch(initAutoUpdates());
    preferencesIpc.onPreferencesChanged((preferences) => {
      store.dispatch(toggleAutoUpdates(preferences));
    });
  } catch (e) {
    // Not in renderer process.
  }
};

export default store;
