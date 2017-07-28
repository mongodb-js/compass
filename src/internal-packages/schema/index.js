const app = require('hadron-app');
const SchemaComponent = require('./lib/component');
const SchemaStatusSubview = require('./lib/component/status-subview');
const SchemaAction = require('./lib/action');
const SchemaStore = require('./lib/store');

/**
 * The collection tab role for the schema component.
 */
const COLLECTION_TAB_ROLE = {
  component: SchemaComponent,
  name: 'SCHEMA',
  hasQueryHistory: true,
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
  appRegistry.registerComponent('Schema.StatusSubview', SchemaStatusSubview);
}

/**
 * Deactivate all the components in the Schema package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.deregisterAction('Schema.Actions');
  app.appRegistry.deregisterStore('Schema.Store');
  app.appRegistry.deregisterComponent('Schema.StatusSubview');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
