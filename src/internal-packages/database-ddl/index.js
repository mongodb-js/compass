const app = require('hadron-app');
const Actions = require('./lib/action');
const CreateDatabaseDialog = require('./lib/component/create-database-dialog');
const DatabasesView = require('./lib/component/connected-databases');
const DropDatabaseDialog = require('./lib/component/drop-database-dialog');
const CreateDatabaseStore = require('./lib/store/create-database-store');
const DatabasesStore = require('./lib/store/databases-store');
const DropDatabaseStore = require('./lib/store/drop-database-store');

/**
 * The instance tab definition.
 */
const INSTANCE_TAB_ROLE = {
  component: DatabasesView,
  name: 'DATABASES',
  order: 1
};

/**
 * Activate all the components in the collection stats package.
 * @param{object} appRegistry   the app registry
 * @see https://github.com/mongodb-js/hadron-app-registry
 */
function activate(appRegistry) {
  appRegistry.registerAction('DatabaseDDL.Actions', Actions);
  appRegistry.registerComponent('DatabaseDDL.CreateDatabaseDialog', CreateDatabaseDialog);
  appRegistry.registerRole('Instance.Tab', INSTANCE_TAB_ROLE);
  appRegistry.registerComponent('DatabaseDDL.DropDatabaseDialog', DropDatabaseDialog);
  appRegistry.registerStore('DatabaseDDL.CreateDatabaseStore', CreateDatabaseStore);
  appRegistry.registerStore('DatabaseDDL.DatabasesStore', DatabasesStore);
  appRegistry.registerStore('DatabaseDDL.DropDatabaseStore', DropDatabaseStore);
}

/**
 * Deactivate all the components in the Database DDL package.
 */
function deactivate() {
  app.appRegistry.deregisterAction('DatabaseDDL.Actions');
  app.appRegistry.deregisterComponent('DatabaseDDL.CreateDatabaseDialog');
  app.appRegistry.deregisterRole('Instance.Tab', INSTANCE_TAB_ROLE);
  app.appRegistry.deregisterComponent('DatabaseDDL.DropDatabaseDialog');
  app.appRegistry.deregisterStore('DatabaseDDL.CreateDatabaseStore');
  app.appRegistry.deregisterStore('DatabaseDDL.DatabasesStore');
  app.appRegistry.deregisterStore('DatabaseDDL.DropDatabaseStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
