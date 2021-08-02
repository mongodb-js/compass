import CompassShell from './plugin';

// export default CompassShell;

// export {
//   CompassShell
// };

// const {
//   store,
//   Plugin
// } = createPlugin();

/**
 * Activate all the components in the Compass Shell package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the shell plugin's role in Compass.
  appRegistry.registerComponent('Global.Shell', CompassShell);
  // appRegistry.registerStore('CompassShell.Store', store);
}

/**
 * Deactivate all the components in the Compass Shell package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterComponent('Global.Shell', CompassShell);
  // appRegistry.deregisterStore('CompassShell.Store');
}

export default CompassShell;
export { activate, deactivate };
