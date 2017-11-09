const CollectionsAction = require('./lib/actions/collections-actions');
const CollectionsTable = require('./lib/components');
const CreateCollectionCheckbox = require('./lib/components/create-collection-checkbox');
const CreateCollectionInput = require('./lib/components/create-collection-input');
const CreateCollectionSizeInput = require('./lib/components/create-collection-size-input');
const CreateCollectionDialog = require('./lib/components/create-collection-dialog');
const DropCollectionDialog = require('./lib/components/drop-collection-dialog');
const ConnectedCollections = require('./lib/components/connected-collections');
const CollectionsStore = require('./lib/stores/collections-store');
const DropCollectionStore = require('./lib/stores/drop-collection-store');
const CreateCollectionStore = require('./lib/stores/create-collection-store');

/**
 * The collection tab role for the document list component.
 */
const DATABASE_TAB_ROLE = {
  component: ConnectedCollections,
  name: 'Collections',
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
  appRegistry.registerStore('Database.DropCollectionStore', DropCollectionStore);
  appRegistry.registerStore('Database.CreateCollectionStore', CreateCollectionStore);
}

/**
 * Deactivate all the components in the Schema package.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Database.Tab', DATABASE_TAB_ROLE);
  appRegistry.deregisterAction('Database.CollectionsActions');
  appRegistry.deregisterComponent('Database.CollectionsTable');
  appRegistry.deregisterComponent('Database.CreateCollectionCheckbox');
  appRegistry.deregisterComponent('Database.CreateCollectionInput');
  appRegistry.deregisterComponent('Database.CreateCollectionSizeInput');
  appRegistry.deregisterComponent('Database.CreateCollectionDialog');
  appRegistry.deregisterComponent('Database.DropCollectionDialog');
  appRegistry.deregisterStore('Database.CollectionsStore');
  appRegistry.deregisterStore('Database.DropCollectionStore');
  appRegistry.reregisterStore('Database.CreateCollectionStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
