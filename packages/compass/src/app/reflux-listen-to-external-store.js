// add Reflux store method to listen to external stores
// https://github.com/reflux/refluxjs/blob/ae5a046bd4c0acdb6d8b199fad413af32a0931ed/README.md#refluxstoremethods

// TODO: In COMPASS-686 we can probably extend the ES6 reflux store classes instead

const app = require('hadron-app');
const Reflux = require('reflux');
const pluginActivationCompleted = require('@mongodb-js/hadron-plugin-manager/lib/action').pluginActivationCompleted;

/**
 * defers attaching a store listener to a store until all packages have
 * been activated in the app registry.
 *
 * @param  {String}   storeKey      The registry key for the store
 * @param  {Function} callback      Callback to attach
 */
Reflux.StoreMethods.listenToExternalStore = function(storeKey, callback) {
  this.listenTo(pluginActivationCompleted, () => {
    const store = app.appRegistry.getStore(storeKey);
    this.listenTo(store, callback);
    this.stopListeningTo(pluginActivationCompleted);
  });
};
