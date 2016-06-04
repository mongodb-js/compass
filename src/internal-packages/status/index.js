'use strict';

const app = require('ampersand-app');
const Status = require('./lib/components/status');

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.componentRegistry.register(Status, { role: 'App:Status' });
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.componentRegistry.deregister(Status);
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
