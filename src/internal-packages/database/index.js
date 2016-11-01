const app = require('ampersand-app');
const CollectionsTable = require('./lib/components');
const CreateCollectionCheckbox = require('./lib/components/create-collection-checkbox');
const CreateCollectionInput = require('./lib/components/create-collection-input');
const CreateCollectionSizeInput = require('./lib/components/create-collection-size-input');

/**
 * Activate all the components in the Schema package.
 */
function activate() {
  app.appRegistry.registerComponent('Database.CollectionsTable', CollectionsTable);
  app.appRegistry.registerComponent('Database.CreateCollectionCheckbox', CreateCollectionCheckbox);
  app.appRegistry.registerComponent('Database.CreateCollectionInput', CreateCollectionInput);
  app.appRegistry.registerComponent('Database.CreateCollectionSizeInput', CreateCollectionSizeInput);
}

/**
 * Deactivate all the components in the Schema package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Database.CollectionsTable');
  app.appRegistry.deregisterComponent('Database.CreateCollectionCheckbox');
  app.appRegistry.deregisterComponent('Database.CreateCollectionInput');
  app.appRegistry.deregisterComponent('Database.CreateCollectionSizeInput');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
