const app = require('ampersand-app');
const CollectionComponent = require('./lib/components');
const CollectionActions = require('./lib/actions');
const CollectionStore = require('./lib/stores');

/**
 * Activate all the components in the Collection package.
 */
function activate() {
  app.appRegistry.registerComponent('Collection.Collection', CollectionComponent);
  app.appRegistry.registerAction('Collection.Actions', CollectionActions);
  app.appRegistry.registerStore('Collection.Store', CollectionStore);
}

/**
 * Deactivate all the components in the Collection package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Collection.Collection');
  app.appRegistry.deregisterAction('Collection.Actions');
  app.appRegistry.deregisterStore('Collection.Store');
}

module.exports = CollectionComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
