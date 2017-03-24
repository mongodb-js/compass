const app = require('hadron-app');
const CollectionView = require('./lib/components');

/**
 * Activate all the components in the Collection package.
 */
function activate() {
  app.appRegistry.registerComponent('Collection.CollectionView', CollectionView);
}

/**
 * Deactivate all the components in the Collection package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Collection.CollectionView');
}

module.exports = CollectionView;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
