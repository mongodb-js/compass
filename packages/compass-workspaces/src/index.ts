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
} from './stores/workspaces';
import Workspaces from './components';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import type Collection from 'mongodb-collection-model';
import type Database from 'mongodb-database-model';
import type { DataService } from 'mongodb-data-service';
import type { DataServiceLocator } from 'mongodb-data-service/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import { WorkspacesStoreContext } from './stores/context';

export type WorkspacesServices = {
  globalAppRegistry: AppRegistry;
  instance: MongoDBInstance;
  dataService: DataService;
};

export function configureStore(
  initialWorkspaceTab: OpenWorkspaceOptions | undefined | null,
  services: WorkspacesServices
) {
  const initialTabs = initialWorkspaceTab
    ? [getInitialTabState(initialWorkspaceTab)]
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
  { initialWorkspaceTab }: { initialWorkspaceTab?: OpenWorkspaceOptions },
  { globalAppRegistry, instance, dataService }: WorkspacesServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = configureStore(initialWorkspaceTab, {
    globalAppRegistry,
    instance,
    dataService,
  });

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

  on(globalAppRegistry, 'menu-share-schema-json', () => {
    const activeTab = getActiveTab(store.getState());
    if (activeTab && activeTab.type === 'Collection') {
      getLocalAppRegistryForTab(activeTab.id).emit('menu-share-schema-json');
    }
  });

  on(globalAppRegistry, 'open-active-namespace-export', function () {
    const activeTab = getActiveTab(store.getState());
    if (activeTab && activeTab.type === 'Collection') {
      globalAppRegistry.emit('open-export', {
        exportFullCollection: true,
        namespace: activeTab.namespace,
        origin: 'menu',
      });
    }
  });

  on(globalAppRegistry, 'open-active-namespace-import', function () {
    const activeTab = getActiveTab(store.getState());
    if (activeTab && activeTab.type === 'Collection') {
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
    instance: mongoDBInstanceLocator,
    dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
  }
);

function activate(): void {
  // noop
}

function deactivate(): void {
  // noop
}

export default WorkspacesPlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
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
} from './types';
