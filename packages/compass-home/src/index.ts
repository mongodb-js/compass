import type AppRegistry from 'hadron-app-registry';
import HomePlugin from './plugin';

/**
 * Activate all the components in the Home package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerComponent('Home.Home', HomePlugin);
}

/**
 * Deactivate all the components in the Home package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterComponent('Home.Home');
}

export default HomePlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
