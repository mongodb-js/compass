const app = require('ampersand-app');
const Actions = require('./lib/action');
const CreateDatabaseDialog = require('./lib/component/create-database-dialog');
const DatabasesView = require('./lib/component/connected-databases');
const DropDatabaseDialog = require('./lib/component/drop-database-dialog');
const CreateDatabaseStore = require('./lib/store/create-database-store');
const DatabasesStore = require('./lib/store/databases-store');
const DropDatabaseStore = require('./lib/store/drop-database-store');

/**
 * Activate all the components in the DDL package.
 */
function activate() {
  app.appRegistry.registerAction('DDL.Actions', Actions);
  app.appRegistry.registerComponent('DDL.CreateDatabase', CreateDatabaseDialog);
  app.appRegistry.registerComponent('DDL.DatabasesView', DatabasesView);
  app.appRegistry.registerComponent('DDL.DropDatabase', DropDatabaseDialog);
  app.appRegistry.registerStore('DDL.CreateDatabaseStore', CreateDatabaseStore);
  app.appRegistry.registerStore('DDL.DatabasesStore', DatabasesStore);
  app.appRegistry.registerStore('DDL.DropDatabaseStore', DropDatabaseStore);
}

/**
 * Deactivate all the components in the DDL package.
 */
function deactivate() {
  app.appRegistry.deregisterAction('DDL.Actions');
  app.appRegistry.deregisterComponent('DDL.CreateDatabase');
  app.appRegistry.deregisterComponent('DDL.DatabasesView');
  app.appRegistry.deregisterComponent('DDL.DropDatabase');
  app.appRegistry.deregisterStore('DDL.CreateDatabaseStore');
  app.appRegistry.deregisterStore('DDL.DatabasesStore');
  app.appRegistry.deregisterStore('DDL.DropDatabaseStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
