import ServerVersionPlugin from './plugin';
import ServerVersionStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'ServerVersion',
  component: ServerVersionPlugin,
  order: 3
};

/**
 * Activate all the components in the Server Version package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('InstanceDetails.Item', ROLE);
  appRegistry.registerStore('ServerVersion.Store', ServerVersionStore);
}

/**
 * Deactivate all the components in the Server Version package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('InstanceDetails.Item', ROLE);
  appRegistry.deregisterStore('ServerVersion.Store');
}

export default ServerVersionPlugin;
export { activate, deactivate };
