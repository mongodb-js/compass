import CollectionStatsPlugin from './plugin';
import CollectionStatsStore from 'stores';
import { DocumentsStatsList, IndexStatsList } from 'components/collection-stats-list';

const DOCUMENTS_STATS_ITEM_ROLE = {
  component: DocumentsStatsList,
  name: 'DOC STATS',
  order: 1
};

const INDEXES_STATS_ITEM_ROLE = {
  component: IndexStatsList,
  name: 'INDEX STATS',
  order: 2
};

/**
 * Activate all the components in the Collection Stats package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerStore('CollectionStats.Store', CollectionStatsStore);
  appRegistry.registerRole('CollectionHUD.Item', DOCUMENTS_STATS_ITEM_ROLE);
  appRegistry.registerRole('CollectionHUD.Item', INDEXES_STATS_ITEM_ROLE);
  appRegistry.registerComponent('CollectionHUD.Item', CollectionStatsPlugin);
}

/**
 * Deactivate all the components in the Collection Stats package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterStore('CollectionStats.Store');
  appRegistry.deregisterRole('CollectionHUD.Item', DOCUMENTS_STATS_ITEM_ROLE);
  appRegistry.deregisterRole('CollectionHUD.Item', INDEXES_STATS_ITEM_ROLE);
  appRegistry.deregisterComponent('CollectionHUD.Item');
}

export default CollectionStatsPlugin;
export { activate, deactivate };
