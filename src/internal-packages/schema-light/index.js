const app = require('hadron-app');
const FieldStore = require('./lib/store/field-store');


/**
 * Activate all the components in the Schema package.
 */
function activate() {
  app.appRegistry.registerStore('Schema.FieldStore', FieldStore);
}

/**
 * Deactivate all the components in the Schema package.
 */
function deactivate() {
  app.appRegistry.deregisterStore('Schema.FieldStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
