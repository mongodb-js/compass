// add Reflux store method to listen to external stores
// https://github.com/reflux/refluxjs/blob/ae5a046bd4c0acdb6d8b199fad413af32a0931ed/README.md#refluxstoremethods
const app = require('hadron-app');
const Reflux = require('reflux');
const packageActivationCompleted = require('hadron-package-manager/lib/action').packageActivationCompleted;
// TODO: In COMPASS-686 we can probably extend the ES6 reflux store classes instead
Reflux.StoreMethods.listenToExternalStore = function(storeKey, callback) {
  this.listenTo(packageActivationCompleted, () => {
    const store = app.appRegistry.getStore(storeKey);
    this.listenTo(store, callback);
    this.stopListeningTo(packageActivationCompleted);
  });
};
