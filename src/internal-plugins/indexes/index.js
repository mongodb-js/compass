const app = require('hadron-app');
const Indexes = require('./lib/component/indexes');
const IndexDefinition = require('./lib/component/index-definition');
const IndexDefinitionType = require('./lib/component/index-definition-type');
const Action = require('./lib/action/index-actions');
const Store = require('./lib/store/sort-indexes-store');
const LoadIndexesStore = require('./lib/store/load-indexes-store');
const UpdateIndexesStore = require('./lib/store/update-indexes-store');

/**
 * The collection tab role for the indexes component.
 */
const COLLECTION_TAB_ROLE = {
  component: Indexes,
  name: 'INDEXES',
  order: 4
};

/**
 * Activate all the components in the Query Bar package.
 */
function activate(appRegistry) {
  appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  appRegistry.registerComponent('Indexes.IndexDefinition', IndexDefinition);
  appRegistry.registerComponent('Indexes.IndexDefinitionType', IndexDefinitionType);
  appRegistry.registerAction('Indexes.LoadIndexes', Action.loadIndexes);
  appRegistry.registerStore('Indexes.IndexStore', Store);
  appRegistry.registerStore('Indexes.LoadIndexesStore', LoadIndexesStore);
  appRegistry.registerStore('Indexes.UpdateIndexesStore', UpdateIndexesStore);
}

/**
 * Deactivate all the components in the Query Bar package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.deregisterComponent('Indexes.IndexDefinition');
  app.appRegistry.deregisterComponent('Indexes.IndexDefinitionType');
  app.appRegistry.deregisterAction('Indexes.LoadIndexes');
  app.appRegistry.deregisterStore('Indexes.IndexStore');
  app.appRegistry.deregisterStore('Indexes.LoadIndexesStore');
  app.appRegistry.deregisterStore('Indexes.UpdateIndexesStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
