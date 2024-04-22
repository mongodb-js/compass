import type AppRegistry from 'hadron-app-registry';
import type { ActivateHelpers } from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { OpenWorkspaceOptions, WorkspaceTab } from './stores/workspaces';
import workspacesReducer, {
  collectionRemoved,
  collectionRenamed,
  databaseRemoved,
  getActiveTab,
  getInitialTabState,
  getLocalAppRegistryForTab,
  cleanupLocalAppRegistries,
} from './stores/workspaces';
import Workspaces from './components';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import { mongoDBInstancesManagerLocator } from '@mongodb-js/compass-app-stores/provider';
import type Collection from 'mongodb-collection-model';
import type Database from 'mongodb-database-model';
import {
  connectionsManagerLocator,
  type ConnectionsManager,
  type ConnectionInfo,
} from '@mongodb-js/compass-connections/provider';
import { WorkspacesStoreContext } from './stores/context';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import {
  type MongoDBInstancesManager,
  MongoDBInstancesManagerEvents,
} from '@mongodb-js/compass-app-stores/provider';

export type WorkspacesServices = {
  globalAppRegistry: AppRegistry;
  instancesManager: MongoDBInstancesManager;
  connectionsManager: ConnectionsManager;
  logger: LoggerAndTelemetry;
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
    },
    applyMiddleware(thunk.withExtraArgument(services))
  );

  return store;
}

export function activateWorkspacePlugin(
  {
    initialWorkspaceTabs,
  }: { initialWorkspaceTabs?: OpenWorkspaceOptions[] | null },
  {
    globalAppRegistry,
    instancesManager,
    connectionsManager,
    logger,
  }: WorkspacesServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const store = configureStore(initialWorkspaceTabs, {
    globalAppRegistry,
    instancesManager,
    connectionsManager,
    logger,
  });

  addCleanup(cleanupLocalAppRegistries);

  const setupInstanceListeners = (instance: MongoDBInstance) => {
    on(instance, 'change:collections._id', (collection: Collection) => {
      const { _id: from } = collection.previousAttributes();
      store.dispatch(collectionRenamed(from, collection.ns));
    });

    on(instance, 'remove:collections', (collection: Collection) => {
      store.dispatch(collectionRemoved(collection.ns));
    });

    on(instance, 'remove:databases', (database: Database) => {
      store.dispatch(databaseRemoved(database.name));
    });
  };

  const existingInstances = instancesManager.listMongoDBInstances();
  for (const instance of existingInstances.values()) {
    setupInstanceListeners(instance);
  }

  on(
    instancesManager,
    MongoDBInstancesManagerEvents.InstanceCreated,
    function (
      connectionInfoId: ConnectionInfo['id'],
      instance: MongoDBInstance
    ) {
      setupInstanceListeners(instance);
    }
  );

  on(globalAppRegistry, 'menu-share-schema-json', () => {
    const activeTab = getActiveTab(store.getState());
    if (activeTab?.type === 'Collection') {
      getLocalAppRegistryForTab(activeTab.id).emit('menu-share-schema-json');
    }
  });

  on(globalAppRegistry, 'open-active-namespace-export', function () {
    const activeTab = getActiveTab(store.getState());
    if (activeTab?.type === 'Collection') {
      globalAppRegistry.emit('open-export', {
        exportFullCollection: true,
        namespace: activeTab.namespace,
        origin: 'menu',
      });
    }
  });

  on(globalAppRegistry, 'open-active-namespace-import', function () {
    const activeTab = getActiveTab(store.getState());
    if (activeTab?.type === 'Collection') {
      globalAppRegistry.emit('open-import', {
        namespace: activeTab.namespace,
        origin: 'menu',
      });
    }
  });

  return {
    store,
    context: WorkspacesStoreContext,
    deactivate: cleanup,
  };
}

const WorkspacesPlugin = registerHadronPlugin(
  {
    name: 'Workspaces',
    component: Workspaces,
    activate: activateWorkspacePlugin,
  },
  {
    instancesManager: mongoDBInstancesManagerLocator,
    connectionsManager: connectionsManagerLocator,
    logger: createLoggerAndTelemetryLocator('COMPASS-WORKSPACES-UI'),
  }
);

export default WorkspacesPlugin;
export { WorkspacesProvider } from './components/workspaces-provider';
export type { OpenWorkspaceOptions, WorkspaceTab };
export type {
  MyQueriesWorkspace,
  ServerStatsWorkspace,
  DatabasesWorkspace,
  CollectionsWorkspace,
  CollectionWorkspace,
  AnyWorkspace,
  Workspace,
  WorkspacePluginProps,
  WorkspaceComponent,
  CollectionSubtab,
} from './types';
