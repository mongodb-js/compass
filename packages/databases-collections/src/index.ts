import { registerCompassPlugin } from 'compass-app-registry';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import { mongoDBInstancesManagerLocator } from '@mongodb-js/compass-app-stores/provider';
import {
  CollectionsPlugin,
  CollectionsWorkspaceName,
} from './collections-plugin';
import {
  DropNamespaceComponent,
  activatePlugin as activateDropNamespacePlugin,
} from './stores/drop-namespace';
import CreateNamespaceModal from './components/create-namespace-modal';
import { activatePlugin as activateCreateNamespacePlugin } from './stores/create-namespace';
import { DatabasesPlugin, DatabasesWorkspaceName } from './databases-plugin';
import MappedRenameCollectionModal from './components/rename-collection-modal/rename-collection-modal';
import { activateRenameCollectionPlugin } from './stores/rename-collection';
import type { WorkspacePlugin } from '@mongodb-js/compass-workspaces';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import {
  favoriteQueryStorageAccessLocator,
  pipelineStorageLocator,
} from '@mongodb-js/my-queries-storage/provider';
import Databases from './components/databases';
import CollectionsList from './components/collections';
import { DatabasesPluginTitleComponent } from './databases-plugin-title';
import { CollectionsPluginTitleComponent } from './collections-plugin-title';

export const CollectionsWorkspaceTab: WorkspacePlugin<
  typeof CollectionsWorkspaceName
> = {
  name: CollectionsWorkspaceName,
  provider: CollectionsPlugin,
  content: CollectionsList,
  header: CollectionsPluginTitleComponent,
};

export const DatabasesWorkspaceTab: WorkspacePlugin<
  typeof DatabasesWorkspaceName
> = {
  name: DatabasesWorkspaceName,
  provider: DatabasesPlugin,
  content: Databases,
  header: DatabasesPluginTitleComponent,
};

export const CreateNamespacePlugin = registerCompassPlugin(
  {
    name: 'CreateNamespace',
    activate: activateCreateNamespacePlugin,
    component: CreateNamespaceModal,
  },
  {
    logger: createLoggerLocator('COMPASS-CREATE-NAMESPACE-UI'),
    track: telemetryLocator,
    connections: connectionsLocator,
    instancesManager: mongoDBInstancesManagerLocator,
    workspaces: workspacesServiceLocator,
  }
);

export const DropNamespacePlugin = registerCompassPlugin(
  {
    name: 'DropNamespace',
    component: DropNamespaceComponent,
    activate: activateDropNamespacePlugin,
  },
  {
    logger: createLoggerLocator('COMPASS-DROP-NAMESPACE-UI'),
    track: telemetryLocator,
    connections: connectionsLocator,
  }
);

export const RenameCollectionPlugin = registerCompassPlugin(
  {
    name: 'RenameCollectionPlugin',
    component: MappedRenameCollectionModal,
    activate: activateRenameCollectionPlugin,
  },
  {
    connections: connectionsLocator,
    instancesManager: mongoDBInstancesManagerLocator,
    queryStorage: favoriteQueryStorageAccessLocator,
    pipelineStorage: pipelineStorageLocator,
  }
);
