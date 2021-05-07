import {
  InstanceStore
} from 'stores';
/**
 * Activate all the components in the App Stores package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerStore('App.InstanceStore', InstanceStore);
}

/**
 * Deactivate all the components in the App Stores package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterStore('App.InstanceStore');
}

export { activate, deactivate };
