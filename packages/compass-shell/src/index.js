import createPlugin from './plugin';

const {
  store,
  Plugin
} = createPlugin();

/**
 * Activate all the components in the Compass Shell package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the shell plugin's role in Compass.
  appRegistry.registerComponent('Global.Shell', Plugin);
  appRegistry.registerStore('CompassShell.Store', store);
}

/**
 * Deactivate all the components in the Compass Shell package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.registerComponent('Global.Shell', Plugin);
  appRegistry.deregisterStore('CompassShell.Store');
}

export default Plugin;
export { activate, deactivate };
