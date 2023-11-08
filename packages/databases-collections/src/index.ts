import type React from 'react';
import type AppRegistry from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import CollectionsPlugin from './collections-plugin';
import DatabasesPlugin from './databases-plugin';
import CollectionsStore from './stores/collections-store';
import DatabasesStore from './stores/databases-store';
import CreateDatabaseModal from './components/create-database-modal';
import { activatePlugin as activateCreateDatabasePlugin } from './stores/create-database';
import DropDatabaseModal from './components/drop-database-modal';
import { activatePlugin as activateDropDatabasePlugin } from './stores/drop-database';
import DropCollectionModal from './components/drop-collection-modal';
import { activatePlugin as activateDropCollectionPlugin } from './stores/drop-collection';
import CreateCollectionModal from './components/create-collection-modal';
import { activatePlugin as activateCreateCollectionPlugin } from './stores/create-collection';

// View collections list plugin.
const COLLECTIONS_PLUGIN_ROLE = {
  name: 'Collections',
  component: CollectionsPlugin,
  order: 1,
};

// View databases list plugin.
const DATABASES_PLUGIN_ROLE = {
  name: 'Databases',
  component: DatabasesPlugin,
  order: 2,
};

// Create collection modal plugin.
export const CreateCollectionPlugin = registerHadronPlugin({
  name: 'CreateCollection',
  component: CreateCollectionModal,
  activate: activateCreateCollectionPlugin,
});

// Drop collection modal plugin.
export const DropCollectionPlugin = registerHadronPlugin({
  name: 'DropCollection',
  component: DropCollectionModal,
  activate: activateDropCollectionPlugin,
});

// Create database modal plugin.
export const CreateDatabasePlugin = registerHadronPlugin({
  name: 'CreateDatabase',
  // Because create-database store is still using javascript, plugin props are
  // not derived correctly without this assertion
  component: CreateDatabaseModal as unknown as React.FunctionComponent,
  activate: activateCreateDatabasePlugin,
});

// Drop database modal plugin.
export const DropDatabasePlugin = registerHadronPlugin({
  name: 'DropDatabase',
  component: DropDatabaseModal,
  activate: activateDropDatabasePlugin,
});

/**
 * Activate all the components in the package.
 **/
function activate(appRegistry: AppRegistry) {
  appRegistry.registerRole('Database.Tab', COLLECTIONS_PLUGIN_ROLE);
  appRegistry.registerStore(
    'CollectionsPlugin.CollectionsStore',
    CollectionsStore
  );

  appRegistry.registerRole('Instance.Tab', DATABASES_PLUGIN_ROLE);
  appRegistry.registerStore('DatabasesPlugin.DatabasesStore', DatabasesStore);
}

/**
 * Deactivate all the components in the package.
 **/
function deactivate(appRegistry: AppRegistry) {
  appRegistry.deregisterRole('Database.Tab', COLLECTIONS_PLUGIN_ROLE);
  appRegistry.deregisterStore('CollectionsPlugin.CollectionsStore');

  appRegistry.deregisterRole('Instance.Tab', DATABASES_PLUGIN_ROLE);
  appRegistry.deregisterStore('DatabasesPlugin.DatabasesStore');
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
