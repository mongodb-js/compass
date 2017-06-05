const app = require('hadron-app');
const InstanceHeaderComponent = require('./lib/components');
const InstanceHeaderActions = require('./lib/actions');
const InstanceHeaderStore = require('./lib/stores');

/**
 * Activate all the components in the Instance Header package.
 */
function activate(appRegistry) {
  appRegistry.registerComponent('InstanceHeader.Component', InstanceHeaderComponent);
  appRegistry.registerAction('InstanceHeader.Actions', InstanceHeaderActions);
  appRegistry.registerStore('InstanceHeader.Store', InstanceHeaderStore);
}

/**
 * Deactivate all the components in the Instance Header package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('InstanceHeader.Component', InstanceHeaderComponent);
  app.appRegistry.deregisterAction('InstanceHeader.Actions', InstanceHeaderActions);
  app.appRegistry.deregisterStore('InstanceHeader.Store', InstanceHeaderStore);
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
