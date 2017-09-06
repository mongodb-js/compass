import QueryHistoryPlugin from './plugin';
import ToggleQueryHistoryButton from 'components/toggle-query-history-button';

import { QueryHistoryStore, RecentListStore, FavoriteListStore } from 'stores';
import { RecentQuery, FavoriteQuery, RecentQueryCollection, FavoriteQueryCollection } from 'models';

import QueryHistoryActions from 'actions';

/**
 * Activate all the components in the Query History package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register Stores
  appRegistry.registerStore('QueryHistory.Store', QueryHistoryStore);
  appRegistry.registerStore('QueryHistory.RecentListStore', RecentListStore);
  appRegistry.registerStore('QueryHistory.FavoriteListStore', FavoriteListStore);

  // Register Components
  appRegistry.registerComponent('QueryHistory.Component', QueryHistoryPlugin);
  appRegistry.registerComponent('QueryHistory.ShowQueryHistoryButton', ToggleQueryHistoryButton);

  // Register Actions
  appRegistry.registerAction('QueryHistory.Actions', QueryHistoryActions);
}

/**
 * Deactivate all the components in the Query History package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  // De-register Stores
  appRegistry.deregisterStore('QueryHistory.Store');
  appRegistry.deregisterStore('QueryHistory.RecentListStore');
  appRegistry.deregisterStore('QueryHistory.FavoriteListStore');

  // De-register Components
  appRegistry.deregisterComponent('QueryHistory.Component');
  appRegistry.deregisterComponent('QueryHistory.ShowQueryHistoryButton');

  // De-register Actions
  appRegistry.deregisterAction('QueryHistory.Actions');
}

export default QueryHistoryPlugin;
export {
  activate,
  deactivate,
  RecentQuery,
  FavoriteQuery,
  RecentListStore,
  FavoriteListStore,
  RecentQueryCollection,
  FavoriteQueryCollection
};
