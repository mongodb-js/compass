import type AppRegistry from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import CollectionsPlugin from './collections-plugin';
import DatabasesPlugin from './databases-plugin';
import CollectionsStore from './stores/collections-store';
import DatabasesStore from './stores/databases-store';
import {
  DropNamespaceComponent,
  activatePlugin as activateDropNamespacePlugin,
} from './stores/drop-namespace';
import CreateNamespaceModal from './components/create-namespace-modal';
import { activatePlugin as activateCreateNamespacePlugin } from './stores/create-namespace';

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

export const CreateNamespacePlugin = registerHadronPlugin(
  {
    name: 'CreateNamespace',
    activate: activateCreateNamespacePlugin,
    component: CreateNamespaceModal,
  },
  {
    logger: createLoggerAndTelemetryLocator('COMPASS-CREATE-NAMESPACE-UI'),
    dataService: dataServiceLocator as typeof dataServiceLocator<
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
    dataService: dataServiceLocator as typeof dataServiceLocator<
      'dropDatabase' | 'dropCollection'
    >,
  }
);

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
