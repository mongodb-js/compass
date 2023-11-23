import type AppRegistry from 'hadron-app-registry';
import CollectionWorkspace from './components/workspace';
import CollectionTab from './components/collection-tab';
import { configureStore } from './stores/collection-tab';
import { registerHadronPlugin } from 'hadron-app-registry';
import { activatePlugin as activateCollectionWorkspace } from './stores/tabs';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import type { DataService } from 'mongodb-data-service';

const COLLECTION_TAB_ROLE = {
  name: 'CollectionTab',
  component: CollectionTab,
  configureStore,
};

const CollectionTabsPlugin = registerHadronPlugin(
  {
    name: 'CollectionTabs',
    component: CollectionWorkspace,
    activate: activateCollectionWorkspace,
  },
  {
    dataService: dataServiceLocator as typeof dataServiceLocator<
      keyof DataService
    >,
  }
);

/**
 * Activate all the components in the Collection package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('CollectionTab.Content', COLLECTION_TAB_ROLE);
}

/**
 * Deactivate all the components in the Collection package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('CollectionTab.Content', COLLECTION_TAB_ROLE);
}

export default CollectionTabsPlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
export type { CollectionTabPluginMetadata } from './modules/collection-tab';
export { CollectionTabsProvider } from './components/collection-tab-provider';
