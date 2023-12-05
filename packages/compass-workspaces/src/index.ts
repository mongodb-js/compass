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
  openWorkspace,
} from './stores/workspaces';
import Workspaces from './components';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import type Collection from 'mongodb-collection-model';
import type Database from 'mongodb-database-model';

export type WorkspacesServices = {
  globalAppRegistry: AppRegistry;
  instance: MongoDBInstance;
};

export function activateWorkspacePlugin(
  { initialWorkspaceTab }: { initialWorkspaceTab?: OpenWorkspaceOptions },
  { globalAppRegistry, instance }: WorkspacesServices,
  { on, cleanup }: ActivateHelpers
) {
  const initialTabs = initialWorkspaceTab
    ? [getInitialTabState(initialWorkspaceTab)]
    : [];

  const store = createStore(
    workspacesReducer,
    {
      tabs: initialTabs,
      activeTabId: initialTabs[initialTabs.length - 1]?.id ?? null,
    },
    applyMiddleware(thunk.withExtraArgument({ globalAppRegistry, instance }))
  );

  // TODO: clean up unneccessary global events
  on(
    globalAppRegistry,
    'open-instance-workspace',
    (workspace?: 'My Queries' | 'Databases' | 'Performance') => {
      store.dispatch(openWorkspace({ type: workspace ?? 'My Queries' }));
    }
  );

  on(globalAppRegistry, 'select-database', (namespace: string) => {
    store.dispatch(openWorkspace({ type: 'Collections', namespace }));
  });

  const openCollection = (
    metadata: CollectionTabPluginMetadata,
    newTab: boolean
  ) => {
    store.dispatch(
      openWorkspace(
        {
          type: 'Collection',
          ...metadata,
        },
        { newTab }
      )
    );
  };

  on(
    globalAppRegistry,
    'open-namespace-in-new-tab',
    (metadata: CollectionTabPluginMetadata) => {
      openCollection(metadata, true);
    }
  );

  on(
    globalAppRegistry,
    'select-namespace',
    (metadata: CollectionTabPluginMetadata) => {
      openCollection(metadata, false);
    }
  );

  on(
    globalAppRegistry,
    'collection-renamed',
    ({ from, to }: { from: string; to: string }) => {
      store.dispatch(collectionRenamed(from, to));
    }
  );

  on(instance, 'remove:collections', (collection: Collection) => {
    store.dispatch(collectionRemoved(collection.ns));
  });

  on(instance, 'remove:databases', (database: Database) => {
    store.dispatch(databaseRemoved(database.name));
  });

  on(globalAppRegistry, 'menu-share-schema-json', () => {
    const activeTab = getActiveTab(store.getState());
    if (!activeTab) return;
    getLocalAppRegistryForTab(activeTab.id).emit('menu-share-schema-json');
  });

  on(globalAppRegistry, 'open-active-namespace-export', function () {
    const activeTab = getActiveTab(store.getState());
    if (!activeTab) return;
    globalAppRegistry.emit('open-export', {
      exportFullCollection: true,
      namespace: activeTab.namespace,
      origin: 'menu',
    });
  });

  on(globalAppRegistry, 'open-active-namespace-import', function () {
    const activeTab = getActiveTab(store.getState());
    if (!activeTab) return;
    globalAppRegistry.emit('open-import', {
      namespace: activeTab.namespace,
      origin: 'menu',
    });
  });

  return {
    store,
    deactivate: cleanup,
  };
}

const WorkspacesPlugin = registerHadronPlugin(
  {
    name: 'Workspaces',
    component: Workspaces,
    activate: activateWorkspacePlugin,
  },
  { instance: mongoDBInstanceLocator }
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
