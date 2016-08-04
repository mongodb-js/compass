const app = require('ampersand-app');
const MetricsComponent = require('./lib/component');
const MetricsAction = require('./lib/action');
const MetricsStore = require('./lib/store');

/**
 * Activate all the components in the Metrics package.
 */
function activate() {
  app.appRegistry.registerComponent('Collection:Metrics', MetricsComponent);
  app.appRegistry.registerAction('MetricsAction', MetricsAction);
  app.appRegistry.registerStore('MetricsStore', MetricsStore);
}

/**
 * Deactivate all the components in the Metrics package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Collection:Metrics');
  app.appRegistry.deregisterAction('MetricsAction');
  app.appRegistry.deregisterStore('MetricsStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
