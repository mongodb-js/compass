import type AppRegistry from 'hadron-app-registry';

import { QueryHistoryPlugin } from './plugin';
import { configureStore } from './stores/query-history-store';
import { FavoriteQueryStorage } from './utils/favorite-query-storage';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Query History',
  component: QueryHistoryPlugin,
  configureStore: configureStore,
  storeName: 'Query.History',
  actionName: 'Query.History.Actions',
};

/**
 * Activate all the components in the Query History package.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Query.QueryHistory', ROLE);
}

/**
 * Deactivate all the components in the Query History package.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Query.QueryHistory', ROLE);
}

export default QueryHistoryPlugin;
export { activate, deactivate, configureStore, FavoriteQueryStorage };
export { default as metadata } from '../package.json';
