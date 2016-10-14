const app = require('ampersand-app');
const StoreConnector = require('./components/store-connector');
const InstanceActions = require('./actions/instance-actions');
const InstanceStore = require('./stores/instance-store');

/**
 * Activate all the components in the Compass Sidebar package.
 */
function activate() {
  app.appRegistry.registerComponent('App.StoreConnector', StoreConnector);
  app.appRegistry.registerAction('App.InstanceActions', InstanceActions);
  app.appRegistry.registerStore('App.InstanceStore', InstanceStore);
}

/**
 * Deactivate all the components in the Compass Sidebar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('App.StoreConnector');
  app.appRegistry.deregisterAction('App.InstanceActions');
  app.appRegistry.deregisterStore('App.InstanceStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
