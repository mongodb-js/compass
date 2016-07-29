'use strict';

const app = require('ampersand-app');
const Schema = require('./lib/component/schema');

/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerComponent('Collection:Schema', Schema);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Collection:Schema');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
