const app = require('ampersand-app');
const CollectionsTable = require('./lib/components');

/**
 * Activate all the components in the Schema package.
 */
function activate() {
  app.appRegistry.registerComponent('Database.CollectionsTable', CollectionsTable);
}

/**
 * Deactivate all the components in the Schema package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Database.CollectionsTable');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
