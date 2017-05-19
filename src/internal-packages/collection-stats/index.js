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
function activate(appRegistry) {
  appRegistry.registerRole('CollectionHUD.Item', DOCUMENTS_STATS_ITEM_ROLE);
  appRegistry.registerRole('CollectionHUD.Item', INDEXES_STATS_ITEM_ROLE);
  appRegistry.registerComponent('CollectionHUD.Item', CollectionStats);
}

/**
 * Deactivate all the components in the collection stats package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('CollectionHUD.Item', DOCUMENTS_STATS_ITEM_ROLE);
  app.appRegistry.deregisterRole('CollectionHUD.Item', INDEXES_STATS_ITEM_ROLE);
  app.appRegistry.deregisterComponent('CollectionHUD.Item', CollectionStats);
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
