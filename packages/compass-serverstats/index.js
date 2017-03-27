module.exports.d3 = require('./lib/d3/');
const app = require('hadron-app');
const RTSSComponent = require('./lib/components');
/**
 * Activate all the components in the RTSS package.
 */
function activate() {
  app.appRegistry.registerComponent('RTSS.ServerStats', RTSSComponent);
}

/**
 * Deactivate all the components in the RTSS package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('RTSS.ServerStats');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;