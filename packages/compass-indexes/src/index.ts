import type AppRegistry from 'hadron-app-registry';

import IndexesPlugin from './plugin';
import CreateIndexPlugin from './create-index-plugin';
import DropIndexPlugin from './drop-index-plugin';
import configureStore from './stores';
import configureCreateIndexStore from './stores/create-index';
import configureDropIndexStore from './stores/drop-index';

// Compass Plugin role definition.
const ROLE = {
  name: 'Indexes',
  component: IndexesPlugin,
  order: 6,
  configureStore: configureStore,
  configureActions: () => {
    /* noop */
  },
  storeName: 'Indexes.Store',
  actionName: 'Indexes.Actions',
};

const CREATE_INDEX_ROLE = {
  name: 'Create Index',
  component: CreateIndexPlugin,
  configureStore: configureCreateIndexStore,
  configureActions: () => {
    /* noop */
  },
  storeName: 'Indexes.CreateIndexStore',
  actionName: 'Indexes.CreateIndexActions',
};

const DROP_INDEX_ROLE = {
  name: 'Drop Index',
  component: DropIndexPlugin,
  configureStore: configureDropIndexStore,
  configureActions: () => {
    /* noop */
  },
  storeName: 'Indexes.DropIndexStore',
  actionName: 'Indexes.DropIndexActions',
};

/**
 * Activate all the components in the Indexes package.
 * @param {Object} appRegistry - The Hadron appRegistry to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Collection.Tab', ROLE);
  appRegistry.registerRole('Collection.ScopedModal', CREATE_INDEX_ROLE);
  appRegistry.registerRole('Collection.ScopedModal', DROP_INDEX_ROLE);
}

/**
 * Deactivate all the components in the Indexes package.
 * @param {Object} appRegistry - The Hadron appRegistry to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
  appRegistry.deregisterRole('Collection.ScopedModal', CREATE_INDEX_ROLE);
  appRegistry.deregisterRole('Collection.ScopedModal', DROP_INDEX_ROLE);
}

export default IndexesPlugin;
export { activate, deactivate, configureStore };
export { default as metadata } from '../package.json';
