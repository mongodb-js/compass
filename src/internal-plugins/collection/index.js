const app = require('hadron-app');
const CollectionComponent = require('./lib/components');

/**
 * Activate all the components in the Collection package.
 */
function activate(appRegistry) {
  appRegistry.registerComponent('Collection.Collection', CollectionComponent);
}

/**
 * Deactivate all the components in the Collection package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Collection.Collection');
}

module.exports = CollectionComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
