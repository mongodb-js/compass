const app = require('hadron-app');
const SchemaComponent = require('./lib/component');
const SchemaAction = require('./lib/action');
const SchemaStore = require('./lib/store');

/**
 * The collection tab role for the schema component.
 */
const COLLECTION_TAB_ROLE = {
  component: SchemaComponent,
  name: 'SCHEMA',
  order: 1
};

/**
 * Activate all the components in the Schema package.
 */
function activate() {
  // app.appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.registerAction('Schema.Actions', SchemaAction);
  app.appRegistry.registerStore('Schema.Store', SchemaStore);
}

/**
 * Deactivate all the components in the Schema package.
 */
function deactivate() {
  // app.appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.deregisterAction('Schema.Actions');
  app.appRegistry.deregisterStore('Schema.Store');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
