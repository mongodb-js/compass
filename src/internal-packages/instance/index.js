const app = require('hadron-app');
const InstanceComponent = require('./lib/component');

/**
 * Activate all the components in the instance package.
 */
function activate() {
  app.appRegistry.registerComponent('Instance.Instance', InstanceComponent);
}

/**
 * Deactivate all the components in the instance package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Instance.Instance');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
