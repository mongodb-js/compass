import type AppRegistry from 'hadron-app-registry';
import CollectionPlugin from './plugin';
import CollectionStore from './stores';
import CollectionTab from './components/collection-tab';
import { configureStore } from './stores/collection';

const COLLECTION_TAB_ROLE = {
  name: 'CollectionTab',
  component: CollectionTab,
  configureStore,
};

/**
 * Activate all the components in the Collection package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerComponent('Collection.Workspace', CollectionPlugin);
  appRegistry.registerStore('Collection.Store', CollectionStore);
  appRegistry.registerRole('CollectionTab.Content', COLLECTION_TAB_ROLE);
}

/**
 * Deactivate all the components in the Collection package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterComponent('Collection.Workspace');
  appRegistry.deregisterStore('Collection.Store');
  appRegistry.deregisterRole('CollectionTab.Content', COLLECTION_TAB_ROLE);
}

export default CollectionPlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
