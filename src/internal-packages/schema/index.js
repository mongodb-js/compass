'use strict';

const app = require('ampersand-app');
const Schema = require('./lib/component/schema');

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.componentRegistry.register(Schema, { role: 'Collection:Schema' });
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.componentRegistry.deregister(Schema);
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
