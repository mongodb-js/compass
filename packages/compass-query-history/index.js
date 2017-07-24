const QueryHistoryComponent = require('./lib/components');
const QueryHistoryActions = require('./lib/actions');
const QueryHistoryStore = require('./lib/stores');
const RecentQuery = require('./lib/models/recent-query');
const FavoriteQuery = require('./lib/models/favorite-query');
const RecentQueryCollection = require('./lib/models/recent-query-collection');
const FavoriteQueryCollection = require('./lib/models/favorite-query-collection');

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'QueryHistory',
  component: QueryHistoryComponent
};

/**
 * Activate all the components in the Query History package.
 */
function activate(appRegistry) {
  // Register the QueryHistoryComponent as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab
  //   - Database.Tab
  //   - Collection.Tab
  //   - CollectionHUD.Item
  //   - Header.Item

  appRegistry.registerRole('QueryHistoryRole', ROLE);
  appRegistry.registerAction('QueryHistory.Actions', QueryHistoryActions);
  appRegistry.registerStore('QueryHistory.Store', QueryHistoryStore);
}

/**
 * Deactivate all the components in the Query History package.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterRole('QueryHistoryRole', ROLE);
  appRegistry.deregisterAction('QueryHistory.Actions');
  appRegistry.deregisterStore('QueryHistory.Store');
}

module.exports = QueryHistoryComponent;
module.exports.RecentQuery = RecentQuery;
module.exports.FavoriteQuery = FavoriteQuery;
module.exports.RecentQueryCollection = RecentQueryCollection;
module.exports.FavoriteQueryCollection = FavoriteQueryCollection;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
