'use strict';

const app = require('ampersand-app');
const SchemaComponent = require('./lib/component');
const SchemaAction = require('./lib/action');
const SchemaStore = require('./lib/store');

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerComponent('Collection:Schema', SchemaComponent);
  app.appRegistry.registerAction('SchemaAction', SchemaAction);
  app.appRegistry.registerStore('SchemaStore', SchemaStore);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Collection:Schema');
  app.appRegistry.deregisterAction('SchemaAction');
  app.appRegistry.deregisterStore('SchemaStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
