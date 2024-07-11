import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { connectionsManagerLocator } from '@mongodb-js/compass-connections/provider';
import { mongoDBInstancesManagerLocator } from '@mongodb-js/compass-app-stores/provider';
import { CollectionsPlugin } from './collections-plugin';
import {
  DropNamespaceComponent,
  activatePlugin as activateDropNamespacePlugin,
} from './stores/drop-namespace';
import CreateNamespaceModal from './components/create-namespace-modal';
import { activatePlugin as activateCreateNamespacePlugin } from './stores/create-namespace';
import { DatabasesPlugin } from './databases-plugin';
import MappedRenameCollectionModal from './components/rename-collection-modal/rename-collection-modal';
import { activateRenameCollectionPlugin } from './stores/rename-collection';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import {
  favoriteQueryStorageAccessLocator,
  pipelineStorageLocator,
} from '@mongodb-js/my-queries-storage/provider';
import { connectionRepositoryAccessLocator } from '@mongodb-js/compass-connections/provider';

export const CollectionsWorkspaceTab: WorkspaceComponent<'Collections'> = {
  name: 'Collections' as const,
  component: CollectionsPlugin,
};

export const DatabasesWorkspaceTab: WorkspaceComponent<'Databases'> = {
  name: 'Databases' as const,
  component: DatabasesPlugin,
};

export const CreateNamespacePlugin = registerHadronPlugin(
  {
    name: 'CreateNamespace',
    activate: activateCreateNamespacePlugin,
    component: CreateNamespaceModal,
  },
  {
    logger: createLoggerLocator('COMPASS-CREATE-NAMESPACE-UI'),
    track: telemetryLocator,
    connectionsManager: connectionsManagerLocator,
    connectionRepository: connectionRepositoryAccessLocator,
    instancesManager: mongoDBInstancesManagerLocator,
    workspaces: workspacesServiceLocator,
  }
);

export const DropNamespacePlugin = registerHadronPlugin(
  {
    name: 'DropNamespace',
    component: DropNamespaceComponent,
    activate: activateDropNamespacePlugin,
  },
  {
    logger: createLoggerLocator('COMPASS-DROP-NAMESPACE-UI'),
    track: telemetryLocator,
    connectionRepository: connectionRepositoryAccessLocator,
    connectionsManager: connectionsManagerLocator,
  }
);

export const RenameCollectionPlugin = registerHadronPlugin(
  {
    name: 'RenameCollectionPlugin',
    component: MappedRenameCollectionModal,
    activate: activateRenameCollectionPlugin,
  },
  {
    connectionsManager: connectionsManagerLocator,
    instancesManager: mongoDBInstancesManagerLocator,
    queryStorage: favoriteQueryStorageAccessLocator,
    pipelineStorage: pipelineStorageLocator,
  }
);
