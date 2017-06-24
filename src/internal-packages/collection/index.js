const app = require('hadron-app');
const CollectionComponent = require('./lib/components');
const CollectionStore = require('./lib/store');

/**
 * Activate all the components in the Collection package.
 */
function activate(appRegistry) {
  appRegistry.registerComponent('Collection.Collection', CollectionComponent);
  appRegistry.registerStore('Collection.Store', CollectionStore);
}

/**
 * Deactivate all the components in the Collection package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Collection.Collection');
  app.appRegistry.deregisterStore('Collection.Store');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
