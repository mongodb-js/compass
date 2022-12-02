import type AppRegistry from 'hadron-app-registry';

import createPlugin from './plugin';

const {
  store,
  Plugin
} = createPlugin();

/**
 * Activate all the components in the Compass Shell package.
 * @param {Object} appRegistry - The appRegistry to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  // Register the shell plugin's role in Compass.
  appRegistry.registerComponent('Global.Shell', Plugin);
  appRegistry.registerStore('CompassShell.Store', store);
}

/**
 * Deactivate all the components in the Compass Shell package.
 * @param {Object} appRegistry - The appRegistry to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.registerComponent('Global.Shell', Plugin);
  appRegistry.deregisterStore('CompassShell.Store');
}

export default Plugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
