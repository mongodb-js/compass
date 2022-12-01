import type AppRegistry from 'hadron-app-registry';
import DatabasePlugin from './plugin';

/**
 * Activate all the components in the Database package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerComponent('Database.Workspace', DatabasePlugin);
}

/**
 * Deactivate all the components in the Database package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterComponent('Database.Workspace');
}

export default DatabasePlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
