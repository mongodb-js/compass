const QueryHistoryComponent = require('./lib/components');
const SidebarStore = require('./lib/stores/sidebar-store');
const RecentListStore = require('./lib/stores/recent-list-store');
const FavoriteListStore = require('./lib/stores/favorites-list-store');
const RecentQuery = require('./lib/models/recent-query');
const FavoriteQuery = require('./lib/models/favorite-query');
const RecentQueryCollection = require('./lib/models/recent-query-collection');
const FavoriteQueryCollection = require('./lib/models/favorite-query-collection');
const ShowQueryHistoryButton = require('./lib/components/show-query-history-button');
const QueryHistoryActions = require('./lib/actions');

/**
 * Activate all the components in the Query History package.
 *
 * @param {object} appRegistry: In order to register shared components, stores,
 * and actions.
 */
function activate(appRegistry) {
  appRegistry.registerStore('QueryHistory.Store', SidebarStore);
  appRegistry.registerStore('QueryHistory.RecentListStore', RecentListStore);
  appRegistry.registerStore('QueryHistory.FavoriteListStore', FavoriteListStore);
  appRegistry.registerComponent('QueryHistory.Component', QueryHistoryComponent);
  appRegistry.registerComponent('QueryHistory.ShowQueryHistoryButton', ShowQueryHistoryButton);
  appRegistry.registerAction('QueryHistory.Actions', QueryHistoryActions);
}

/**
 * Deactivate all the components in the Query History package.
 *
 * @param {object} appRegistry: In order to deregister shared components,
 * stores, and actions.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterStore('QueryHistory.Store');
  appRegistry.deregisterStore('QueryHistory.RecentListStore');
  appRegistry.deregisterStore('QueryHistory.FavoriteListStore');
  appRegistry.deregisterComponent('QueryHistory.Component');
  appRegistry.deregisterComponent('QueryHistory.ShowQueryHistoryButton');
  appRegistry.deregisterAction('QueryHistory.Actions');
}

module.exports = QueryHistoryComponent;
module.exports.RecentQuery = RecentQuery;
module.exports.FavoriteQuery = FavoriteQuery;
module.exports.FavoriteListStore = FavoriteListStore;
module.exports.RecentListStore = RecentListStore;
module.exports.RecentQueryCollection = RecentQueryCollection;
module.exports.FavoriteQueryCollection = FavoriteQueryCollection;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
