const MetricsStore = require('./lib/store');
const IntercomComponent = require('./lib/component/intercom');

/**
 * Activate all the components in the instance package.
 *
 * @param {Object} appRegistry   the app registry.
 */
function activate(appRegistry) {
  appRegistry.registerComponent('Metrics.Intercom', IntercomComponent);
  appRegistry.registerStore('Metrics.Store', MetricsStore);
}

/**
 * Deactivate all the components in the instance package.
 *
 * @param {Object} appRegistry   the app registry.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterComponent('Metrics.Intercom');
  appRegistry.deregisterStore('Metrics.Store');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
