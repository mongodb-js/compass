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
import toNS from 'mongodb-ns';

export type WorkspacesServices = {
  globalAppRegistry: AppRegistry;
  instance: MongoDBInstance;
  dataService: DataService;
};

/**
 * When opening tabs initially, there might be the case that db and collection
 * models don't exist yet on the instance model. Workspaces expect the models to
 * exist when rendered, so we prepopulate instance model with collections and
 * databases to support that case
 */
function prepopulateInstanceModel(
  tabs: OpenWorkspaceOptions[],
  instance: MongoDBInstance
) {
  for (const tab of tabs) {
    if (tab.type === 'Collections' || tab.type === 'Collection') {
      const { ns, database, collection, validCollectionName } = toNS(
        tab.namespace
      );
      const db =
        instance.databases.get(database) ??
        instance.databases.add({ _id: database });

      if (
        collection &&
        validCollectionName &&
        !db.collections.get(collection, 'name')
      ) {
        db.collections.add({ _id: ns });
      }
    }
  }
}

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

  prepopulateInstanceModel(initialTabs, services.instance);

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
  { globalAppRegistry, instance, dataService }: WorkspacesServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = configureStore(initialWorkspaceTabs, {
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
