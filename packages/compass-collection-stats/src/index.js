import CollectionStatsPlugin from './plugin';
import DocumentStatsItem from './components/document-stats-item';
import IndexStatsItem from './components/index-stats-item';
import configureStore from './stores';

const COLLECTION_HUD_ROLE = {
  component: CollectionStatsPlugin,
  order: 1,
  name: 'Collection HUD',
  configureStore: configureStore,
  configureActions: () => {},
  storeName: 'CollectionStats.Store'
};

const DOCUMENTS_STATS_ITEM_ROLE = {
  component: DocumentStatsItem,
  name: 'document-stats',
  order: 1
};

const INDEXES_STATS_ITEM_ROLE = {
  component: IndexStatsItem,
  name: 'index-stats',
  order: 2
};

/**
 * Activate the Collection Stats plugin.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Collection.HUD', COLLECTION_HUD_ROLE);
}

/**
 * Deactivate the Collection Stats plugin.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Collection.HUD', COLLECTION_HUD_ROLE);
}

export default CollectionStatsPlugin;
export { activate, deactivate };
