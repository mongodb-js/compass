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
 * @param {Object} appRegistry - the app registry
 */
function activate(appRegistry) {
  // @todo: Temporary hack to remove the internal plugin from the community edition.
  if (process.env.HADRON_PRODUCT !== 'mongodb-compass-community') {
    appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
    appRegistry.registerAction('Schema.Actions', SchemaAction);
    appRegistry.registerStore('Schema.Store', SchemaStore);
    appRegistry.registerComponent('Schema.StatusSubview', SchemaStatusSubview);
  }
}

/**
 * Deactivate all the components in the Schema package.
 *
 * @param {Object} appRegistry - the app registry
 */
function deactivate(appRegistry) {
  if (process.env.HADRON_PRODUCT !== 'mongodb-compass-community') {
    appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
    appRegistry.deregisterAction('Schema.Actions');
    appRegistry.deregisterStore('Schema.Store');
    appRegistry.deregisterComponent('Schema.StatusSubview');
  }
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
