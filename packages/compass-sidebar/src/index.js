import SidebarPlugin from './plugin';
import SidebarStore from 'stores';

/**
 * Activate all the components in the Sidebar package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerComponent('Sidebar.Component', SidebarPlugin);
  appRegistry.registerStore('Sidebar.Store', SidebarStore);
}

/**
 * Deactivate all the components in the Sidebar package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterComponent('Sidebar.Component');
  appRegistry.deregisterStore('Sidebar.Store');
}

export default SidebarPlugin;
export { activate, deactivate };
