const app = require('hadron-app');
const Indexes = require('./lib/component/indexes');
const IndexDefinition = require('./lib/component/index-definition');
const IndexDefinitionType = require('./lib/component/index-definition-type');
const Action = require('./lib/action/index-actions');
const Store = require('./lib/store/sort-indexes-store');

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
function activate() {
  app.appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.registerComponent('Indexes.IndexDefinition', IndexDefinition);
  app.appRegistry.registerComponent('Indexes.IndexDefinitionType', IndexDefinitionType);
  app.appRegistry.registerAction('Indexes.LoadIndexes', Action.loadIndexes);
  app.appRegistry.registerStore('Indexes.IndexStore', Store);
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
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
