import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import type { OpenWorkspaceOptions } from './stores/workspaces';
import workspacesReducer, {
  collectionRemoved,
  collectionRenamed,
  databaseRemoved,
  getInitialTabState,
  cleanupLocalAppRegistries,
  connectionDisconnected,
  updateDatabaseInfo,
  updateCollectionInfo,
  loadSavedWorkspaces,
  beforeUnloading,
} from './stores/workspaces';
import Workspaces from './components';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import { workspacesStateChangeMiddleware } from './stores/workspaces-middleware';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import { mongoDBInstancesManagerLocator } from '@mongodb-js/compass-app-stores/provider';
import type Collection from 'mongodb-collection-model';
import type Database from 'mongodb-database-model';
import {
  connectionsLocator,
  type ConnectionInfo,
  type ConnectionsService,
} from '@mongodb-js/compass-connections/provider';
import { WorkspacesStoreContext } from './stores/context';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import {
  type MongoDBInstancesManager,
  MongoDBInstancesManagerEvents,
} from '@mongodb-js/compass-app-stores/provider';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { workspacesStorageServiceLocator } from './services/workspaces-storage';
import type { WorkspacesStateSchema } from '@mongodb-js/workspace-info';
import { type IUserData } from '@mongodb-js/compass-user-data';

export type WorkspacesServices = {
  globalAppRegistry: AppRegistry;
  instancesManager: MongoDBInstancesManager;
  connections: ConnectionsService;
  logger: Logger;
  preferences: PreferencesAccess;
  userData: IUserData<typeof WorkspacesStateSchema>;
};

export function configureStore(
  initialWorkspaceTabs: OpenWorkspaceOptions[] | undefined | null,
  services: WorkspacesServices
) {
  const initialTabs =
    initialWorkspaceTabs && initialWorkspaceTabs.length > 0
      ? initialWorkspaceTabs.map((tab) => {
          return getInitialTabState(tab);
        })
      : [];

  const store = createStore(
    workspacesReducer,
    {
      tabs: initialTabs,
      activeTabId: initialTabs[initialTabs.length - 1]?.id ?? null,
      collectionInfo: {},
      databaseInfo: {},
    },
    applyMiddleware(
      thunk.withExtraArgument(services),
      workspacesStateChangeMiddleware(services)
    )
  );

  return store;
}

export function activateWorkspacePlugin(
  {
    initialWorkspaceTabs,
    onBeforeUnloadCallbackRequest,
  }: {
    initialWorkspaceTabs?: OpenWorkspaceOptions[] | null;
    onBeforeUnloadCallbackRequest?: (canCloseCallback: () => boolean) => void;
  },
  {
    globalAppRegistry,
    instancesManager,
    connections,
    logger,
    preferences,
    userData,
  }: WorkspacesServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const store = configureStore(initialWorkspaceTabs, {
    globalAppRegistry,
    instancesManager,
    connections,
    logger,
    preferences,
    userData,
  });

  void store.dispatch(loadSavedWorkspaces());

  addCleanup(cleanupLocalAppRegistries);

  const setupInstanceListeners = (
    connectionId: string,
    instance: MongoDBInstance
  ) => {
    on(instance, 'change:collections._id', (collection: Collection) => {
      const { _id: from } = collection.previousAttributes();
      store.dispatch(collectionRenamed(from, collection.ns));
    });

    on(
      instance,
      'change:databases.inferred_from_privileges',
      (database: Database) => {
        const namespaceId = `${connectionId}.${database._id}`;
        const databaseInfo = {
          inferredFromPrivileges: database.inferred_from_privileges,
        };
        store.dispatch(updateDatabaseInfo(namespaceId, databaseInfo));
      }
    );

    on(
      instance,
      'change:collections.inferred_from_privileges',
      (collection: Collection) => {
        const namespaceId = `${connectionId}.${collection._id}`;
        const collectionInfo = {
          isTimeSeries: collection.isTimeSeries,
          isReadonly: collection.readonly ?? collection.isView,
          sourceName: collection.sourceName,
          inferredFromPrivileges: collection.inferred_from_privileges,
        };
        store.dispatch(updateCollectionInfo(namespaceId, collectionInfo));
      }
    );

    on(instance, 'remove:collections', (collection: Collection) => {
      store.dispatch(collectionRemoved(collection.ns));
    });

    on(instance, 'remove:databases', (database: Database) => {
      store.dispatch(databaseRemoved(database.name));
    });
  };

  for (const [connId, instance] of instancesManager.listMongoDBInstances()) {
    setupInstanceListeners(connId, instance);
  }

  on(
    instancesManager,
    MongoDBInstancesManagerEvents.InstanceCreated,
    function (
      connectionInfoId: ConnectionInfo['id'],
      instance: MongoDBInstance
    ) {
      setupInstanceListeners(connectionInfoId, instance);
    }
  );

  on(
    connections,
    'disconnected',
    function (connectionId: ConnectionInfo['id']) {
      store.dispatch(connectionDisconnected(connectionId));
    }
  );

  onBeforeUnloadCallbackRequest?.(() => {
    return store.dispatch(beforeUnloading());
  });

  return {
    store,
    context: WorkspacesStoreContext,
    deactivate: cleanup,
  };
}

const WorkspacesPlugin = registerCompassPlugin(
  {
    name: 'Workspaces',
    component: Workspaces,
    activate: activateWorkspacePlugin,
  },
  {
    instancesManager: mongoDBInstancesManagerLocator,
    connections: connectionsLocator,
    logger: createLoggerLocator('COMPASS-WORKSPACES-UI'),
    preferences: preferencesLocator,
    userData: workspacesStorageServiceLocator,
  }
);

export default WorkspacesPlugin;
export { WorkspacesProvider } from './components/workspaces-provider';

export { WorkspacesStorageServiceProviderDesktop } from './services/workspaces-storage-desktop';
export { WorkspacesStorageServiceProviderWeb } from './services/workspaces-storage-web';

export type { OpenWorkspaceOptions } from './stores/workspaces';
