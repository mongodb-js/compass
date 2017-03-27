const app = require('hadron-app');
const PerformanceView = require('./lib/components/performance-component');

/**
 * Activate all the components in the RTSS package.
 */
function activate() {
  app.appRegistry.registerComponent('Performance.PerformanceView', PerformanceView);
}

/**
 * Deactivate all the components in the RTSS package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Performance.PerformanceView');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
