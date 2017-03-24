const app = require('hadron-app');
const InstanceView = require('./lib/components/instance-view');

/**
 * Activate all the components in the RTSS package.
 */
function activate() {
  app.appRegistry.registerComponent('Instance.InstanceView', InstanceView);
}

/**
 * Deactivate all the components in the RTSS package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Instance.InstanceView');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
