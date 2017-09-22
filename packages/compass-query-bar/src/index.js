import QueryBarPlugin from './plugin';
import QueryBarActions from 'actions';
import QueryBarStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'QueryBar',
  component: QueryBarPlugin
};

/**
 * Activate all the components in the Query Bar package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the QueryBarPlugin as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab
  //   - Database.Tab
  //   - Collection.Tab
  //   - CollectionHUD.Item
  //   - Header.Item

  appRegistry.registerRole('', ROLE);
  appRegistry.registerAction('QueryBar.Actions', QueryBarActions);
  appRegistry.registerStore('QueryBar.Store', QueryBarStore);
}

/**
 * Deactivate all the components in the Query Bar package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('', ROLE);
  appRegistry.deregisterAction('QueryBar.Actions');
  appRegistry.deregisterStore('QueryBar.Store');
}

export default QueryBarPlugin;
export { activate, deactivate };
