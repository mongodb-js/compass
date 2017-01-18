// add Reflux store method to listen to external stores
const app = require('ampersand-app');
const Reflux = require('reflux');
const packageActivationCompleted = require('hadron-package-manager/lib/action').packageActivationCompleted;
// TODO: We should devise a cleaner pattern, we should not be mutating reflux
// TODO: ... by adding this listenToExternalStore unless we wish to fork reflux
Reflux.StoreMethods.listenToExternalStore = function(storeKey, callback) {
  this.listenTo(packageActivationCompleted, () => {
    const store = app.appRegistry.getStore(storeKey);
    this.listenTo(store, callback);
    this.stopListeningTo(packageActivationCompleted);
  });
};
