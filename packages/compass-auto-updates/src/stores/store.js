import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, { updateAvailable } from '../modules';

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
     * Listen to changes in user preferences.
     */
    ipc.on('compass:preferences-changed', (_, preferences) => {
      if (preferences.autoUpdates) {
        ipc.call('app:enable-auto-update');
      } else {
        ipc.call('app:disable-auto-update');
      }
    });
  } catch (e) {
    // Not in renderer process.
  }
};

export default store;
