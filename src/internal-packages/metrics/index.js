const MetricsStore = require('./lib/store');

/**
 * Activate all the components in the instance package.
 *
 * @param {Object} appRegistry   the app registry.
 */
function activate(appRegistry) {
  appRegistry.registerStore('Metrics.Store', MetricsStore);
}

/**
 * Deactivate all the components in the instance package.
 *
 * @param {Object} appRegistry   the app registry.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterComponent('Metrics.Store');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
