const app = require('ampersand-app');
const MetricsComponent = require('./lib/component');

/**
 * Activate all the components in the Metrics package.
 */
function activate() {
  app.appRegistry.registerComponent('Collection:Metrics', MetricsComponent);
}

/**
 * Deactivate all the components in the Metrics package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Collection:Metrics');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
