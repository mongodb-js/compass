const app = require('hadron-app');
const CollectionStats = require('./lib/component/');
const DocumentsStatsItem = require('./lib/component/documents-stats-item');
const IndexesStatsItem = require('./lib/component/indexes-stats-item');

const DOCUMENTS_STATS_ITEM_ROLE = {
  component: DocumentsStatsItem,
  name: 'DOC STATS',
  order: 1
};

const INDEXES_STATS_ITEM_ROLE = {
  component: IndexesStatsItem,
  name: 'INDEX STATS',
  order: 2
};

/**
 * Activate all the components in the collection stats package.
 */
function activate() {
  app.appRegistry.registerRole('CollectionStats.CollectionStatsItem', DOCUMENTS_STATS_ITEM_ROLE);
  app.appRegistry.registerRole('CollectionStats.CollectionStatsItem', INDEXES_STATS_ITEM_ROLE);
  app.appRegistry.registerComponent('CollectionStats.CollectionStats', CollectionStats);
}

/**
 * Deactivate all the components in the collection stats package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('CollectionStats.CollectionItem', DOCUMENTS_STATS_ITEM_ROLE);
  app.appRegistry.deregisterRole('CollectionStats.CollectionStatsItem', INDEXES_STATS_ITEM_ROLE);
  app.appRegistry.registerComponent('CollectionStats.CollectionStats', CollectionStats);
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
