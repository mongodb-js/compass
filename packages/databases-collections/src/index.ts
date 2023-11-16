import type AppRegistry from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import {
  dataServiceLocator,
  type DataServiceLocator,
} from 'mongodb-data-service/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import CollectionsPlugin from './collections-plugin';
import CollectionsStore from './stores/collections-store';
import {
  DropNamespaceComponent,
  activatePlugin as activateDropNamespacePlugin,
} from './stores/drop-namespace';
import CreateNamespaceModal from './components/create-namespace-modal';
import { activatePlugin as activateCreateNamespacePlugin } from './stores/create-namespace';
import { DatabasesPlugin } from './databases-plugin';
import MappedRenameCollectionModal from './components/rename-collection-modal/rename-collection-modal';
import { activateRenameCollectionPlugin } from './stores/rename-collection';

// View collections list plugin.
const COLLECTIONS_PLUGIN_ROLE = {
  name: 'Collections',
  component: CollectionsPlugin,
  order: 1,
};

export const InstanceTab = {
  name: 'Databases',
  component: DatabasesPlugin,
};

export const CreateNamespacePlugin = registerHadronPlugin(
  {
    name: 'CreateNamespace',
    activate: activateCreateNamespacePlugin,
    component: CreateNamespaceModal,
  },
  {
    logger: createLoggerAndTelemetryLocator('COMPASS-CREATE-NAMESPACE-UI'),
    dataService: dataServiceLocator as DataServiceLocator<
      'createCollection' | 'createDataKey' | 'configuredKMSProviders'
    >,
    instance: mongoDBInstanceLocator,
  }
);

export const DropNamespacePlugin = registerHadronPlugin(
  {
    name: 'DropNamespace',
    component: DropNamespaceComponent,
    activate: activateDropNamespacePlugin,
  },
  {
    logger: createLoggerAndTelemetryLocator('COMPASS-DROP-NAMESPACE-UI'),
    dataService: dataServiceLocator as DataServiceLocator<
      'dropDatabase' | 'dropCollection'
    >,
  }
);

export const RenameCollectionPlugin = registerHadronPlugin({
  name: 'RenameCollectionPlugin',
  component: MappedRenameCollectionModal,
  activate: activateRenameCollectionPlugin,
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
}

/**
 * Deactivate all the components in the package.
 **/
function deactivate(appRegistry: AppRegistry) {
  appRegistry.deregisterRole('Database.Tab', COLLECTIONS_PLUGIN_ROLE);
  appRegistry.deregisterStore('CollectionsPlugin.CollectionsStore');
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
