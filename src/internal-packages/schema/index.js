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
  order: 2
};

/**
 * Activate all the components in the Schema package.
 *
 * @param {Object} appRegistry   the app registry
 */
function activate(appRegistry) {
  appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  appRegistry.registerAction('Schema.Actions', SchemaAction);
  appRegistry.registerStore('Schema.Store', SchemaStore);
}

/**
 * Deactivate all the components in the Schema package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.deregisterAction('Schema.Actions');
  app.appRegistry.deregisterStore('Schema.Store');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
