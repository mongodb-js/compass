import DatabasePlugin from './plugin';

/**
 * Activate all the components in the Database package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerComponent('Database.Workspace', DatabasePlugin);
}

/**
 * Deactivate all the components in the Database package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterComponent('Database.Workspace');
}

export default DatabasePlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
