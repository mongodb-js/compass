import CollectionsPlugin from './collections-plugin';
import DatabasesPlugin from './databases-plugin';
import CollectionsStore from './stores/collections-store';
import DatabasesStore from './stores/databases-store';
import CreateCollectionPlugin from './components/create-collection-plugin';
import CreateCollectionStore from './stores/create-collection';
import DropCollectionPlugin from './components/drop-collection-plugin';
import DropCollectionStore from './stores/drop-collection';
import CreateDatabasePlugin from './components/create-database-plugin';
import DropDatabasePlugin from './components/drop-database-plugin';
import CreateDatabaseStore from './stores/create-database';
import DropDatabaseStore from './stores/drop-database';
import Collation from './components/collation-fields';

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
const CREATE_COLLECTION_ROLE = {
  name: 'Create Collection',
  component: CreateCollectionPlugin,
};

// Drop collection modal plugin.
const DROP_COLLECTION_ROLE = {
  name: 'Drop Collection',
  component: DropCollectionPlugin,
};

// Create database modal plugin.
const CREATE_DATABASE_ROLE = {
  name: 'Create Database',
  component: CreateDatabasePlugin,
};

// Drop database modal plugin.
const DROP_DATABASE_ROLE = {
  name: 'Drop Database',
  component: DropDatabasePlugin,
};

/**
 * Activate all the components in the package.
 * @param {Object} appRegistry - The Hadron appRegistry to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Database.Tab', COLLECTIONS_PLUGIN_ROLE);
  appRegistry.registerRole('Global.Modal', CREATE_COLLECTION_ROLE);
  appRegistry.registerRole('Global.Modal', DROP_COLLECTION_ROLE);
  appRegistry.registerComponent('Collation.Select', Collation);
  appRegistry.registerStore(
    'CollectionsPlugin.CollectionsStore',
    CollectionsStore
  );
  appRegistry.registerStore(
    'CollectionsPlugin.CreateCollectionStore',
    CreateCollectionStore
  );
  appRegistry.registerStore(
    'CollectionsPlugin.DropCollectionStore',
    DropCollectionStore
  );

  appRegistry.registerRole('Instance.Tab', DATABASES_PLUGIN_ROLE);
  appRegistry.registerRole('Global.Modal', CREATE_DATABASE_ROLE);
  appRegistry.registerRole('Global.Modal', DROP_DATABASE_ROLE);
  appRegistry.registerStore('DatabasesPlugin.DatabasesStore', DatabasesStore);
  appRegistry.registerStore(
    'DatabasesPlugin.CreateDatabaseStore',
    CreateDatabaseStore
  );
  appRegistry.registerStore(
    'DatabasesPlugin.DropDatabaseStore',
    DropDatabaseStore
  );
}

/**
 * Deactivate all the components in the package.
 * @param {Object} appRegistry - The Hadron appRegistry to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Database.Tab', COLLECTIONS_PLUGIN_ROLE);
  appRegistry.deregisterRole('Global.Modal', CREATE_COLLECTION_ROLE);
  appRegistry.deregisterRole('Global.Modal', DROP_COLLECTION_ROLE);
  appRegistry.deregisterComponent('Collation.Select');
  appRegistry.deregisterStore('CollectionsPlugin.CollectionsStore');
  appRegistry.deregisterStore('CollectionsPlugin.CreateCollectionStore');
  appRegistry.deregisterStore('CollectionsPlugin.DropCollectionStore');

  appRegistry.deregisterRole('Instance.Tab', DATABASES_PLUGIN_ROLE);
  appRegistry.deregisterRole('Global.Modal', CREATE_DATABASE_ROLE);
  appRegistry.deregisterRole('Global.Modal', DROP_DATABASE_ROLE);
  appRegistry.deregisterStore('DatabasesPlugin.DatabasesStore');
  appRegistry.deregisterStore('DatabasesPlugin.CreateDatabaseStore');
  appRegistry.deregisterStore('DatabasesPlugin.DropDatabaseStore');
}

export default {
  CollectionsPlugin,
  DatabasesPlugin,
};
export { activate, deactivate };
export { default as metadata } from '../package.json';
