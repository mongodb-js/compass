'use strict';

const app = require('ampersand-app');
const Status = require('./lib/components/status');

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerComponent('App:Status', Status);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('App:Status');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
