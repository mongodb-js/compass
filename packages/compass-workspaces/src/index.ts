import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import type {
  OpenWorkspaceOptions,
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
  updateDatabaseInfo,
  updateCollectionInfo,
} from './stores/workspaces';
import Workspaces from './components';
import { WorkspacesWeb } from './components';
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
import { AtlasService } from '../../atlas-service/dist/atlas-service';
import { WorkspacesStateSchema } from './services/workspaces-storage';
import {
  AtlasUserData,
  FileUserData,
  IUserData,
} from '../../compass-user-data/dist/user-data';
import { EJSON } from 'bson';

export type WorkspacesServices = {
  globalAppRegistry: AppRegistry;
  instancesManager: MongoDBInstancesManager;
  connections: ConnectionsService;
  logger: Logger;
  preferences: PreferencesAccess;
};

export function configureStore(
  initialWorkspaceTabs: OpenWorkspaceOptions[] | undefined | null,
  userData: IUserData<typeof WorkspacesStateSchema>,
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
      userData,
    },
    applyMiddleware(
      thunk.withExtraArgument(services),
      workspacesStateChangeMiddleware(userData)
    )
  );

  return store;
}

function activateWorkspacePluginHelper(
  userData: IUserData<typeof WorkspacesStateSchema>,
  {
    globalAppRegistry,
    instancesManager,
    connections,
    logger,
    preferences,
  }: WorkspacesServices,
  { on, cleanup, addCleanup }: ActivateHelpers,
  initialWorkspaceTabs?: OpenWorkspaceOptions[] | null
) {
  const store = configureStore(initialWorkspaceTabs, userData, {
    globalAppRegistry,
    instancesManager,
    connections,
    logger,
    preferences,
  });

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

export function activateWorkspacePlugin(
  {
    initialWorkspaceTabs,
  }: {
    initialWorkspaceTabs?: OpenWorkspaceOptions[] | null;
  },
  workspacesServices: WorkspacesServices,
  activateHelpers: ActivateHelpers
) {
  const userData = new FileUserData(WorkspacesStateSchema, 'WorkspacesState', {
    serialize: (content) => EJSON.stringify(content, undefined, 2),
    deserialize: (content: string) => EJSON.parse(content),
  }) as IUserData<typeof WorkspacesStateSchema>;

  return activateWorkspacePluginHelper(
    userData,
    workspacesServices,
    activateHelpers,
    initialWorkspaceTabs
  );
}

export function activateWorkspacePluginWeb(
  {
    initialWorkspaceTabs,
    projectId,
    orgId,
    atlasService,
  }: {
    initialWorkspaceTabs?: OpenWorkspaceOptions[] | null;
    projectId: string;
    orgId: string;
    atlasService: AtlasService;
  },
  workspacesServices: WorkspacesServices,
  activateHelpers: ActivateHelpers
) {
  const userData = new AtlasUserData(WorkspacesStateSchema, 'WorkspacesState', {
    orgId,
    projectId,
    getResourceUrl: (path?: string) => {
      const url = atlasService.userDataEndpoint(`/${path || ''}`);
      return url;
    },
    authenticatedFetch: atlasService.authenticatedFetch.bind(atlasService),
    serialize: (content) => EJSON.stringify(content),
    deserialize: (content: string) => EJSON.parse(content),
  });

  return activateWorkspacePluginHelper(
    userData,
    workspacesServices,
    activateHelpers,
    initialWorkspaceTabs
  );
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
  }
);

export const WorkspacesWebPlugin = registerCompassPlugin(
  {
    name: 'Workspaces',
    component: WorkspacesWeb,
    activate: activateWorkspacePluginWeb,
  },
  {
    instancesManager: mongoDBInstancesManagerLocator,
    connections: connectionsLocator,
    logger: createLoggerLocator('COMPASS-WORKSPACES-UI'),
    preferences: preferencesLocator,
  }
);

export { loadWorkspaceStateFromUserData } from './stores/workspaces-middleware';
export { WorkspacesStateSchema } from './services/workspaces-storage';
export default WorkspacesPlugin;
export { WorkspacesProvider } from './components/workspaces-provider';
export type { OpenWorkspaceOptions, CollectionTabInfo };
export type {
  WelcomeWorkspace,
  MyQueriesWorkspace,
  DataModelingWorkspace,
  ServerStatsWorkspace,
  ShellWorkspace,
  DatabasesWorkspace,
  CollectionsWorkspace,
  CollectionWorkspace,
  AnyWorkspace,
  Workspace,
  WorkspacePlugin,
  WorkspaceTab,
  CollectionSubtab,
  WorkspacePluginProps,
} from './types';
