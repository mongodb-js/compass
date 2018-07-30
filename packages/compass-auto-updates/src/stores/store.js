import { createStore } from 'redux';
import reducer from 'modules';
import ipc from 'hadron-ipc';

const store = createStore(reducer);

/**
 * Checking for new version.
 */
ipc.on('app:checking-for-update', () => {
  // debug('checking for update');
});

/**
 * No update available.
 */
ipc.on('app:update-not-available', () => {
});

/**
 * Update available.
 */
ipc.on('app:update-available', () => {
  // debug('new update available!  wanna update to', _opts, '?');
  // this.visible = true;
});

/**
 * Update downloaded.
 */
ipc.on('app:update-downloaded', () => {
  // debug('the update has been downloaded.');
});

// this.listenToAndRun(app.preferences, 'change:autoUpdates', function() {
  // if (app.isFeatureEnabled('autoUpdates')) {
    // ipc.call('app:enable-auto-update');
  // } else {
    // ipc.call('app:disable-auto-update');
  // }
// });

export default store;
