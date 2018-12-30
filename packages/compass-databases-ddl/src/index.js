import DdlPlugin from './plugin';
import DdlStore from 'stores';
import CreateDatabaseStore from 'stores/create-database';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Databases',
  component: DdlPlugin,
  order: 1
};

/**
 * Activate all the components in the Ddl package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Instance.Tab', ROLE);
  appRegistry.registerStore('DatabaseDDL.DatabasesStore', DdlStore);
  appRegistry.registerStore('DatabaseDDL.CreateDatabaseStore', CreateDatabaseStore);
}

/**
 * Deactivate all the components in the Ddl package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Instance.Tab', ROLE);
  appRegistry.deregisterStore('DatabaseDDL.DatabasesStore');
  appRegistry.deregisterStore('DatabaseDDL.CreateDatabaseStore');
}

export default DdlPlugin;
export { activate, deactivate };
