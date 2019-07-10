import SshTunnelStatusPlugin from './plugin';
import SshTunnelStatusStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'SshTunnelStatus',
  component: SshTunnelStatusPlugin,
  order: 1
};

/**
 * Activate all the components in the Ssh Tunnel Status package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('InstanceDetails.Item', ROLE);
  appRegistry.registerStore('SshTunnelStatus.Store', SshTunnelStatusStore);
}

/**
 * Deactivate all the components in the Ssh Tunnel Status package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('InstanceDetails.Item', ROLE);
  appRegistry.deregisterStore('SshTunnelStatus.Store');
}

export default SshTunnelStatusPlugin;
export { activate, deactivate };
