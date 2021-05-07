import DdlPlugin from './plugin';
import CreateDatabasePlugin from 'components/create-database-plugin';
import DropDatabasePlugin from 'components/drop-database-plugin';
import DdlStore from 'stores';
import CreateDatabaseStore from 'stores/create-database';
import DropDatabaseStore from 'stores/drop-database';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Databases',
  component: DdlPlugin,
  order: 1
};

/**
 * Create DB modal plugin.
 */
const CREATE_ROLE = {
  name: 'Create Database',
  component: CreateDatabasePlugin
};

/**
 * Drop DB modal plugin.
 */
const DROP_ROLE = {
  name: 'Drop Database',
  component: DropDatabasePlugin
};

/**
 * Activate all the components in the Ddl package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Instance.Tab', ROLE);
  appRegistry.registerRole('Global.Modal', CREATE_ROLE);
  appRegistry.registerRole('Global.Modal', DROP_ROLE);
  appRegistry.registerStore('DatabaseDDL.DatabasesStore', DdlStore);
  appRegistry.registerStore('DatabaseDDL.CreateDatabaseStore', CreateDatabaseStore);
  appRegistry.registerStore('DatabaseDDL.DropDatabaseStore', DropDatabaseStore);
}

/**
 * Deactivate all the components in the Ddl package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Instance.Tab', ROLE);
  appRegistry.deregisterRole('Global.Modal', CREATE_ROLE);
  appRegistry.deregisterRole('Global.Modal', DROP_ROLE);
  appRegistry.deregisterStore('DatabaseDDL.DatabasesStore');
  appRegistry.deregisterStore('DatabaseDDL.CreateDatabaseStore');
  appRegistry.deregisterStore('DatabaseDDL.DropDatabaseStore');
}

export default DdlPlugin;
export { activate, deactivate };
