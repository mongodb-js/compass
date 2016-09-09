const app = require('ampersand-app');
const RTSSComponent = require('./lib/component');
/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerComponent('RTSS', RTSSComponent);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('RTSS');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
