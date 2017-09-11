import StatusPlugin from './plugin';
import StatusActions from 'actions';
import StatusStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Status',
  component: StatusPlugin
};

/**
 * Activate all the components in the Compass Status package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Application.Status', ROLE);
  appRegistry.registerAction('Status.Actions', StatusActions);
  appRegistry.registerStore('Status.Store', StatusStore);
}

/**
 * Deactivate all the components in the Compass Status package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Application.Status', ROLE);
  appRegistry.deregisterAction('Status.Actions');
  appRegistry.deregisterStore('Status.Store');
}

export default StatusPlugin;
export { activate, deactivate };
