import QueryHistoryPlugin from './plugin';
import configureStore from 'stores';
import configureActions from 'actions';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Query History',
  component: QueryHistoryPlugin,
  configureStore: configureStore,
  configureActions: configureActions,
  storeName: 'Query.History'
};

/**
 * Activate all the components in the Query History package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Query.History', ROLE);
}

/**
 * Deactivate all the components in the Query History package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Query.History', ROLE);
}

export default QueryHistoryPlugin;
export { activate, deactivate, configureStore, configureActions };
