const app = require('ampersand-app');
const SchemaComponent = require('./lib/component');
const SchemaAction = require('./lib/action');
const SchemaStore = require('./lib/store');

/**
 * Activate all the components in the Schema package.
 */
function activate() {
  app.appRegistry.registerComponent('Schema.Schema', SchemaComponent);
  app.appRegistry.registerAction('Schema.Actions', SchemaAction);
  app.appRegistry.registerStore('Schema.Store', SchemaStore);
}

/**
 * Deactivate all the components in the Schema package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Schema.Schema');
  app.appRegistry.deregisterAction('Schema.Actions');
  app.appRegistry.deregisterStore('Schema.Store');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
