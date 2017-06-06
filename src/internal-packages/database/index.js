const app = require('hadron-app');
const CollectionsAction = require('./lib/actions/collections-actions');
const CollectionsTable = require('./lib/components');
const CreateCollectionCheckbox = require('./lib/components/create-collection-checkbox');
const CreateCollectionInput = require('./lib/components/create-collection-input');
const CreateCollectionSizeInput = require('./lib/components/create-collection-size-input');
const CreateCollectionDialog = require('./lib/components/create-collection-dialog');
const DropCollectionDialog = require('./lib/components/drop-collection-dialog');
const ConnectedCollections = require('./lib/components/connected-collections');
const CollectionsStore = require('./lib/stores/collections-store');

/**
 * The collection tab role for the document list component.
 */
const DATABASE_TAB_ROLE = {
  component: ConnectedCollections,
  name: 'COLLECTIONS',
  order: 1
};

/**
 * Activate all the components in the Schema package.
 */
function activate(appRegistry) {
  appRegistry.registerRole('Database.Tab', DATABASE_TAB_ROLE);
  appRegistry.registerAction('Database.CollectionsActions', CollectionsAction);
  appRegistry.registerComponent('Database.CollectionsTable', CollectionsTable);
  appRegistry.registerComponent('Database.CreateCollectionCheckbox', CreateCollectionCheckbox);
  appRegistry.registerComponent('Database.CreateCollectionInput', CreateCollectionInput);
  appRegistry.registerComponent('Database.CreateCollectionSizeInput', CreateCollectionSizeInput);
  appRegistry.registerComponent('Database.CreateCollectionDialog', CreateCollectionDialog);
  appRegistry.registerComponent('Database.DropCollectionDialog', DropCollectionDialog);
  appRegistry.registerStore('Database.CollectionsStore', CollectionsStore);
}

/**
 * Deactivate all the components in the Schema package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Database.Tab', DATABASE_TAB_ROLE);
  app.appRegistry.deregisterAction('Database.CollectionsActions');
  app.appRegistry.deregisterComponent('Database.CollectionsTable');
  app.appRegistry.deregisterComponent('Database.CreateCollectionCheckbox');
  app.appRegistry.deregisterComponent('Database.CreateCollectionInput');
  app.appRegistry.deregisterComponent('Database.CreateCollectionSizeInput');
  app.appRegistry.deregisterComponent('Database.CreateCollectionDialog');
  app.appRegistry.deregisterComponent('Database.DropCollectionDialog');
  app.appRegistry.deregisterStore('Database.CollectionsStore', CollectionsStore);
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
