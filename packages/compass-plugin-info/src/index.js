import SecurityPlugin from './plugin';
import SecurityActions from 'actions';
import SecurityStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Security',
  component: SecurityPlugin
};

/**
 * Activate all the components in the Security package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the SecurityPlugin as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab
  //   - Database.Tab
  //   - Collection.Tab
  //   - CollectionHUD.Item
  //   - Header.Item

  appRegistry.registerRole('Application.Security', ROLE);
  appRegistry.registerAction('Security.Actions', SecurityActions);
  appRegistry.registerStore('Security.Store', SecurityStore);
}

/**
 * Deactivate all the components in the Security package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Application.Security', ROLE);
  appRegistry.deregisterAction('Security.Actions');
  appRegistry.deregisterStore('Security.Store');
}

export default SecurityPlugin;
export { activate, deactivate };
