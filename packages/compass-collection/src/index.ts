import type AppRegistry from 'hadron-app-registry';

import CollectionPlugin from './plugin';
import CollectionStore from './stores';

/**
 * Activate all the components in the Collection package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerComponent('Collection.Workspace', CollectionPlugin);
  appRegistry.registerStore('Collection.Store', CollectionStore);
}

/**
 * Deactivate all the components in the Collection package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterComponent('Collection.Workspace');
  appRegistry.deregisterStore('Collection.Store');
}

export default CollectionPlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
