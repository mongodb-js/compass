import HomePlugin from './plugin';
import HomeStore from 'stores';

/**
 * Activate all the components in the Home package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerComponent('Home.Home', HomePlugin);
  appRegistry.registerStore('Home.Store', HomeStore);
}

/**
 * Deactivate all the components in the Home package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterStore('Home.Store');
  appRegistry.deregisterComponent('Home.Home');
}

export default HomePlugin;
export { activate, deactivate };
