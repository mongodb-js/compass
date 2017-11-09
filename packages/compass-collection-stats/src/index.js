import CollectionStatsPlugin from './plugin';
import CollectionStatsStore from 'stores';
import DocumentStatsItem from 'components/document-stats-item';
import IndexStatsItem from 'components/index-stats-item';

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
  appRegistry.registerStore('CollectionStats.Store', CollectionStatsStore);
  appRegistry.registerComponent('CollectionStats.Component', CollectionStatsPlugin);
}

/**
 * Deactivate all the components in the Collection Stats package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('CollectionHUD.Item', DOCUMENTS_STATS_ITEM_ROLE);
  appRegistry.deregisterRole('CollectionHUD.Item', INDEXES_STATS_ITEM_ROLE);
  appRegistry.deregisterStore('CollectionStats.Store');
  appRegistry.deregisterComponent('CollectionStats.Component');
}

export default CollectionStatsPlugin;
export { activate, deactivate };
