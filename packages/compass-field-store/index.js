const FieldActions = require('./lib/actions');
const FieldStore = require('./lib/stores');

/**
 * Activate all the components in the Compass Field Store package.
 *
 * @param {Object} appRegistry   the registry to register the components with
 */
function activate(appRegistry) {
  appRegistry.registerAction('Field.Actions', FieldActions);
  appRegistry.registerStore('Field.Store', FieldStore);
}

/**
 * Deactivate all the components in the Compass Field Store package.
 *
 * @param {Object} appRegistry   the registry to register the components with
 */
function deactivate(appRegistry) {
  appRegistry.deregisterAction('Field.Actions');
  appRegistry.deregisterStore('Field.Store');
}

module.exports = FieldStore;
module.exports.Actions = FieldActions;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
