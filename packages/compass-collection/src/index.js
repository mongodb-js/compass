import DatabasePlugin from './plugin';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Database',
  component: DatabasePlugin
};

/**
 * Activate all the components in the Database package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Database.Workspace', ROLE);
}

/**
 * Deactivate all the components in the Database package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Database.Workspace', ROLE);
}

export default DatabasePlugin;
export { activate, deactivate };
