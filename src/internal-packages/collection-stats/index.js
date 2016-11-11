const app = require('ampersand-app');
const CollectionStatsComponent = require('./lib/components');
const CollectionStatsActions = require('./lib/actions');
const CollectionStatsStore = require('./lib/stores');

/**
 * Activate all the components in the CollectionStats package.
 */
function activate() {
  app.appRegistry.registerComponent('CollectionStats.CollectionStats', CollectionStatsComponent);
  app.appRegistry.registerAction('CollectionStats.Actions', CollectionStatsActions);
  app.appRegistry.registerStore('CollectionStats.Store', CollectionStatsStore);
}

/**
 * Deactivate all the components in the CollectionStats package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('CollectionStats.CollectionStats');
  app.appRegistry.deregisterAction('CollectionStats.Actions');
  app.appRegistry.deregisterStore('CollectionStats.Store');
}

module.exports = CollectionStatsComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
