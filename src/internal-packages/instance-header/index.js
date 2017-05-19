const app = require('hadron-app');
const InstanceHeaderComponent = require('./lib/components');
const InstanceHeaderActions = require('./lib/actions');

/**
 * Activate all the components in the Instance Header package.
 */
function activate(appRegistry) {
  appRegistry.registerComponent('InstanceHeader.Component', InstanceHeaderComponent);
  appRegistry.registerAction('InstanceHeader.Actions', InstanceHeaderActions);
}

/**
 * Deactivate all the components in the Instance Header package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('InstanceHeader.Component', InstanceHeaderComponent);
  app.appRegistry.deregisterAction('InstanceHeader.Actions', InstanceHeaderActions);
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
