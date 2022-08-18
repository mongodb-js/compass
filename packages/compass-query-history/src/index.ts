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
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  // TODO(COMPASS-5679): After we enable the toolbars feature flag,
  // we can remove the ScopedModal role for this plugin as it's no longer used.
  appRegistry.registerRole('Collection.ScopedModal', ROLE);

  appRegistry.registerRole('Query.QueryHistory', ROLE);
}

/**
 * Deactivate all the components in the Query History package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Collection.ScopedModal', ROLE);

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
