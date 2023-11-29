import type AppRegistry from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
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

export const CollectionsWorkspaceTab = {
  name: 'Collections' as const,
  component: CollectionsPlugin,
};

export type CollectionsWorkspace = {
  type: typeof CollectionsWorkspaceTab['name'];
} & React.ComponentProps<typeof CollectionsWorkspaceTab['component']>;

export const DatabasesWorkspaceTab = {
  name: 'Databases' as const,
  component: DatabasesPlugin,
};

export type DatabasesWorkspace = {
  type: typeof DatabasesWorkspaceTab['name'];
} & React.ComponentProps<typeof DatabasesWorkspaceTab['component']>;

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
  appRegistry.registerStore(
    'CollectionsPlugin.CollectionsStore',
    CollectionsStore
  );
}

/**
 * Deactivate all the components in the package.
 **/
function deactivate(appRegistry: AppRegistry) {
  appRegistry.deregisterStore('CollectionsPlugin.CollectionsStore');
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
