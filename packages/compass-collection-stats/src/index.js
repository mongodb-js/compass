import CollectionStatsPlugin from './plugin';
import DocumentStatsItem from 'components/document-stats-item';
import IndexStatsItem from 'components/index-stats-item';
import configureStore from 'stores';

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
 * Activate all the components in the Collection Stats package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('CollectionHUD.Item', DOCUMENTS_STATS_ITEM_ROLE);
  appRegistry.registerRole('CollectionHUD.Item', INDEXES_STATS_ITEM_ROLE);
  appRegistry.registerRole('Collection.HUD', COLLECTION_HUD_ROLE);
}

/**
 * Deactivate all the components in the Collection Stats package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('CollectionHUD.Item', DOCUMENTS_STATS_ITEM_ROLE);
  appRegistry.deregisterRole('CollectionHUD.Item', INDEXES_STATS_ITEM_ROLE);
  appRegistry.deregisterRole('Collection.HUD', COLLECTION_HUD_ROLE);
}

export default CollectionStatsPlugin;
export { activate, deactivate };
