import QueryBarPlugin from './plugin';
import configureActions from 'actions';
import configureStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Query Bar',
  component: QueryBarPlugin,
  configureStore: configureStore,
  configureActions: configureActions,
  storeName: 'Query.Store'
};

/**
 * Activate all the components in the Query Bar package.
 * @param {Object} appRegistry - The global appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Query.QueryBar', ROLE);
}

/**
 * Deactivate all the components in the Query Bar package.
 * @param {Object} appRegistry - The global appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Query.QueryBar', ROLE);
}

export default QueryBarPlugin;
export { activate, deactivate, configureStore, configureActions };
