const app = require('hadron-app');
const Actions = require('./lib/action');
const CreateDatabaseDialog = require('./lib/component/create-database-dialog');
const DatabasesTable = require('./lib/component/connected-databases');
const DropDatabaseDialog = require('./lib/component/drop-database-dialog');
const CreateDatabaseStore = require('./lib/store/create-database-store');
const DatabasesStore = require('./lib/store/databases-store');
const DropDatabaseStore = require('./lib/store/drop-database-store');

/**
 * Activate all the components in the Instance package.
 */
function activate() {
  app.appRegistry.registerAction('Instance.Actions', Actions);
  app.appRegistry.registerComponent('Instance.CreateDatabaseDialog', CreateDatabaseDialog);
  app.appRegistry.registerComponent('Instance.DatabasesTable', DatabasesTable);
  app.appRegistry.registerComponent('Instance.DropDatabaseDialog', DropDatabaseDialog);
  app.appRegistry.registerStore('Instance.CreateDatabaseStore', CreateDatabaseStore);
  app.appRegistry.registerStore('Instance.DatabasesStore', DatabasesStore);
  app.appRegistry.registerStore('Instance.DropDatabaseStore', DropDatabaseStore);
}

/**
 * Deactivate all the components in the Instance package.
 */
function deactivate() {
  app.appRegistry.deregisterAction('Instance.Actions');
  app.appRegistry.deregisterComponent('Instance.CreateDatabaseDialog');
  app.appRegistry.deregisterComponent('Instance.DatabasesTable');
  app.appRegistry.deregisterComponent('Instance.DropDatabaseDialog');
  app.appRegistry.deregisterStore('Instance.CreateDatabaseStore');
  app.appRegistry.deregisterStore('Instance.DatabasesStore');
  app.appRegistry.deregisterStore('Instance.DropDatabaseStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
