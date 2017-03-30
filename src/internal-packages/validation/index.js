const app = require('hadron-app');
const ValidationComponent = require('./lib/components');
const ValidationActions = require('./lib/actions');
const ValidationStore = require('./lib/stores');

/**
 * The collection tab role for the validation component.
 */
const COLLECTION_TAB_ROLE = {
  component: ValidationComponent,
  name: 'VALIDATION',
  order: 5,
  minimumServerVersion: '3.2.0-rc0'
};

/**
 * Activate all the components in the Validation package.
 */
function activate() {
  app.appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.registerAction('Validation.Actions', ValidationActions);
  app.appRegistry.registerStore('Validation.Store', ValidationStore);
}

/**
 * Deactivate all the components in the Validation package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.deregisterAction('Validation.Actions');
  app.appRegistry.deregisterStore('Validation.Store');
}

module.exports = ValidationComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
