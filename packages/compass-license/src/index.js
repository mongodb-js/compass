import LicensePlugin from './plugin';
import LicenseActions from 'actions';
import LicenseStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'License',
  component: LicensePlugin
};

/**
 * Activate all the components in the License package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Application.License', ROLE);
  appRegistry.registerAction('License.Actions', LicenseActions);
  appRegistry.registerStore('License.Store', LicenseStore);
}

/**
 * Deactivate all the components in the License package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Application.License', ROLE);
  appRegistry.deregisterAction('License.Actions');
  appRegistry.deregisterStore('License.Store');
}

export default LicensePlugin;
export { activate, deactivate };
