const QueryHistoryComponent = require('./lib/components');
const QueryHistoryStore = require('./lib/stores');
const RecentQuery = require('./lib/models/recent-query');
const FavoriteQuery = require('./lib/models/favorite-query');
const RecentQueryCollection = require('./lib/models/recent-query-collection');
const FavoriteQueryCollection = require('./lib/models/favorite-query-collection');

/**
 * Activate all the components in the Query History package.
 */
function activate(appRegistry) {
  appRegistry.registerStore('QueryHistory.Store', QueryHistoryStore);
}

/**
 * Deactivate all the components in the Query History package.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterStore('QueryHistory.Store');
}

module.exports = QueryHistoryComponent;
module.exports.RecentQuery = RecentQuery;
module.exports.FavoriteQuery = FavoriteQuery;
module.exports.RecentQueryCollection = RecentQueryCollection;
module.exports.FavoriteQueryCollection = FavoriteQueryCollection;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
