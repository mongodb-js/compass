const app = require('hadron-app');
const ValidationComponent = require('./lib/components');
const ValidationActions = require('./lib/actions');
const ValidationStore = require('./lib/stores');

/**
 * Activate all the components in the Validation package.
 */
function activate() {
  app.appRegistry.registerComponent('Validation.Validation', ValidationComponent);
  app.appRegistry.registerAction('Validation.Actions', ValidationActions);
  app.appRegistry.registerStore('Validation.Store', ValidationStore);
}

/**
 * Deactivate all the components in the Validation package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Validation.Validation');
  app.appRegistry.deregisterAction('Validation.Actions');
  app.appRegistry.deregisterStore('Validation.Store');
}

module.exports = ValidationComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
