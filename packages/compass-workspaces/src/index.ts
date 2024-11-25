import type AppRegistry from 'hadron-app-registry';
import type { ActivateHelpers } from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import type {
  OpenWorkspaceOptions,
  WorkspaceTab,
  CollectionTabInfo,
} from './stores/workspaces';
import workspacesReducer, {
  collectionRemoved,
  collectionRenamed,
  databaseRemoved,
  getActiveTab,
  getInitialTabState,
  getLocalAppRegistryForTab,
  cleanupLocalAppRegistries,
  connectionDisconnected,
} from './stores/workspaces';
import Workspaces from './components';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
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

export type WorkspacesServices = {
  globalAppRegistry: AppRegistry;
  instancesManager: MongoDBInstancesManager;
  connections: ConnectionsService;
  logger: Logger;
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
    connections,
    logger,
  }: WorkspacesServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const store = configureStore(initialWorkspaceTabs, {
    globalAppRegistry,
    instancesManager,
    connections,
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

  on(
    connections,
    'disconnected',
    function (connectionId: ConnectionInfo['id']) {
      store.dispatch(connectionDisconnected(connectionId));
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
      globalAppRegistry.emit(
        'open-export',
        {
          exportFullCollection: true,
          namespace: activeTab.namespace,
          origin: 'menu',
        },
        {
          connectionId: activeTab.connectionId,
        }
      );
    }
  });

  on(globalAppRegistry, 'open-active-namespace-import', function () {
    const activeTab = getActiveTab(store.getState());
    if (activeTab?.type === 'Collection') {
      globalAppRegistry.emit(
        'open-import',
        {
          namespace: activeTab.namespace,
          origin: 'menu',
        },
        {
          connectionId: activeTab.connectionId,
        }
      );
    }
  });

  // TODO(COMPASS-8033): activate this code and account for it in e2e tests and
  // electron environment
  // function onBeforeUnload(evt: BeforeUnloadEvent) {
  //   const canUnload = store.getState().tabs.every((tab) => {
  //     return canCloseTab(tab);
  //   });
  //   if (!canUnload) {
  //     evt.preventDefault();
  //   }
  // }
  // window.addEventListener('beforeunload', onBeforeUnload);
  // addCleanup(() => {
  //   window.removeEventListener('beforeunload', onBeforeUnload);
  // });

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
    connections: connectionsLocator,
    logger: createLoggerLocator('COMPASS-WORKSPACES-UI'),
  }
);

export default WorkspacesPlugin;
export { WorkspacesProvider } from './components/workspaces-provider';
export type { OpenWorkspaceOptions, WorkspaceTab, CollectionTabInfo };
export type {
  WelcomeWorkspace,
  MyQueriesWorkspace,
  ServerStatsWorkspace,
  ShellWorkspace,
  DatabasesWorkspace,
  CollectionsWorkspace,
  CollectionWorkspace,
  AnyWorkspace,
  Workspace,
  WorkspacePluginProps,
  WorkspaceComponent,
  CollectionSubtab,
} from './types';
