'use strict';

const app = require('ampersand-app');
const ServerStatsComponent = require('./lib/component');
/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerComponent('ServerStats', ServerStatsComponent);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('ServerStats');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
