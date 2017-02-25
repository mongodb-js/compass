const app = require('hadron-app');
const InstanceHeaderComponent = require('./lib/components');
const InstanceHeaderActions = require('./lib/actions');

/**
 * Activate all the components in the Query Bar package.
 */
function activate() {
  app.appRegistry.registerComponent('InstanceHeader.Component', InstanceHeaderComponent);
  app.appRegistry.registerAction('InstanceHeader.Actions', InstanceHeaderActions);
}

/**
 * Deactivate all the components in the Query Bar package.
 */
function deactivate() {
  // app.appRegistry.deregisterComponent('Query.QueryBar');
  app.appRegistry.deregisterComponent('InstanceHeader.Component', InstanceHeaderComponent);
  app.appRegistry.deregisterAction('InstanceHeader.Actions', InstanceHeaderComponent);
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
