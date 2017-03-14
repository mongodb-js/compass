const app = require('hadron-app');
const SchemaComponent = require('./lib/component');
const SchemaAction = require('./lib/action');
const SchemaStore = require('./lib/store');
const FieldStore = require('./lib/store/field-store');

/**
 * Activate all the components in the Schema package.
 */
function activate() {
  app.appRegistry.registerComponent('Schema.Schema', SchemaComponent);
  app.appRegistry.registerAction('Schema.Actions', SchemaAction);
  app.appRegistry.registerStore('Schema.Store', SchemaStore);
  app.appRegistry.registerStore('Schema.FieldStore', FieldStore);
}

/**
 * Deactivate all the components in the Schema package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Schema.Schema');
  app.appRegistry.deregisterAction('Schema.Actions');
  app.appRegistry.deregisterStore('Schema.Store');
  app.appRegistry.deregisterStore('Schema.FieldStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
