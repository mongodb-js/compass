import type AppRegistry from 'hadron-app-registry';

import QueryHistoryPlugin from './plugin';
import configureStore from './stores';
import configureActions from './actions';
import { FavoriteQueryStorage } from './utils';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Query History',
  component: QueryHistoryPlugin,
  configureStore: configureStore,
  configureActions: configureActions,
  storeName: 'Query.History',
  actionName: 'Query.History.Actions',
};

/**
 * Activate all the components in the Query History package.
 * @param {Object} appRegistry - The Hadron appRegistry to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Query.QueryHistory', ROLE);
}

/**
 * Deactivate all the components in the Query History package.
 * @param {Object} appRegistry - The Hadron appRegistry to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Query.QueryHistory', ROLE);
}

export default QueryHistoryPlugin;
export {
  activate,
  deactivate,
  configureStore,
  configureActions,
  FavoriteQueryStorage,
};
export { default as metadata } from '../package.json';
