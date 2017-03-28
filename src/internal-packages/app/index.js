const app = require('hadron-app');
const StoreConnector = require('./lib/components/store-connector');
const TabNavBar = require('./lib/components/tab-nav-bar');
const InstanceActions = require('./lib/actions/instance-actions');
const InstanceStore = require('./lib/stores/instance-store');
const CollectionStore = require('./lib/stores/collection-store');

/**
 * Activate all the components in the Compass Sidebar package.
 */
function activate() {
  app.appRegistry.registerComponent('App.StoreConnector', StoreConnector);
  app.appRegistry.registerComponent('App.TabNavBar', TabNavBar);
  app.appRegistry.registerAction('App.InstanceActions', InstanceActions);
  app.appRegistry.registerStore('App.InstanceStore', InstanceStore);
  app.appRegistry.registerStore('App.CollectionStore', CollectionStore);
}

/**
 * Deactivate all the components in the Compass Sidebar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('App.StoreConnector');
  app.appRegistry.deregisterComponent('App.TabNavBar');
  app.appRegistry.deregisterAction('App.InstanceActions');
  app.appRegistry.deregisterStore('App.InstanceStore');
  app.appRegistry.deregisterStore('App.CollectionStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
