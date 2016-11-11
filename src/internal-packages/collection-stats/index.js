const app = require('ampersand-app');
const CollectionStats = require('./lib/component/');

/**
 * Activate all the components in the collection stats package.
 */
function activate() {
  app.appRegistry.registerComponent('CollectionStats.CollectionStats', CollectionStats);
}

/**
 * Deactivate all the components in the collection stats package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('CollectionStats.CollectionStats');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
