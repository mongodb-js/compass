const app = require('hadron-app');
const Actions = require('./lib/action');
const CreateDatabaseDialog = require('./lib/component/create-database-dialog');
const DatabasesTable = require('./lib/component/connected-databases');
const DropDatabaseDialog = require('./lib/component/drop-database-dialog');
const CreateDatabaseStore = require('./lib/store/create-database-store');
const DatabasesStore = require('./lib/store/databases-store');
const DropDatabaseStore = require('./lib/store/drop-database-store');

/**
 * Activate all the components in the Database DDL package.
 */
function activate() {
  app.appRegistry.registerAction('DatabaseDDL.Actions', Actions);
  app.appRegistry.registerComponent('DatabaseDDL.CreateDatabaseDialog', CreateDatabaseDialog);
  app.appRegistry.registerComponent('DatabaseDDL.DatabasesTable', DatabasesTable);
  app.appRegistry.registerComponent('DatabaseDDL.DropDatabaseDialog', DropDatabaseDialog);
  app.appRegistry.registerStore('DatabaseDDL.CreateDatabaseStore', CreateDatabaseStore);
  app.appRegistry.registerStore('DatabaseDDL.DatabasesStore', DatabasesStore);
  app.appRegistry.registerStore('DatabaseDDL.DropDatabaseStore', DropDatabaseStore);
}

/**
 * Deactivate all the components in the Database DDL package.
 */
function deactivate() {
  app.appRegistry.deregisterAction('DatabaseDDL.Actions');
  app.appRegistry.deregisterComponent('DatabaseDDL.CreateDatabaseDialog');
  app.appRegistry.deregisterComponent('DatabaseDDL.DatabasesTable');
  app.appRegistry.deregisterComponent('DatabaseDDL.DropDatabaseDialog');
  app.appRegistry.deregisterStore('DatabaseDDL.CreateDatabaseStore');
  app.appRegistry.deregisterStore('DatabaseDDL.DatabasesStore');
  app.appRegistry.deregisterStore('DatabaseDDL.DropDatabaseStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
