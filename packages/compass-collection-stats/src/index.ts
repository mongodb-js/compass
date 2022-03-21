import type AppRegistry from 'hadron-app-registry';

import CollectionStatsPlugin from './plugin';
import configureStore from './stores';

const role = {
  component: CollectionStatsPlugin,
  name: 'Collection HUD',
  order: 1,
  configureStore: configureStore,
  storeName: 'CollectionStats.Store',
};

/**
 * Activate the Collection Stats plugin.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Collection.HUD', role);
}

/**
 * Deactivate the Collection Stats plugin.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Collection.HUD', role);
}

export default CollectionStatsPlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
