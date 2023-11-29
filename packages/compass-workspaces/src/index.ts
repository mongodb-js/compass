import type AppRegistry from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { OpenWorkspaceOptions } from './stores/workspaces';
import workspacesReducer, {
  collectionRemoved,
  collectionRenamed,
  databaseRemoved,
  getActiveTab,
  getInitialTabState,
  getLocalAppRegistryForTab,
  openWorkspace,
} from './stores/workspaces';
import Workspaces from './components/workspaces';
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

const WorkspacesPlugin = registerHadronPlugin(
  {
    name: 'Workspaces',
    component: Workspaces,
    activate(
      { initialTab }: { initialTab?: OpenWorkspaceOptions },
      { globalAppRegistry, instance }: WorkspacesServices
    ) {
      const initialTabs = initialTab ? [getInitialTabState(initialTab)] : [];

      const store = createStore(
        workspacesReducer,
        {
          tabs: initialTabs,
          activeTabId: initialTabs[0]?.id ?? null,
        },
        applyMiddleware(
          thunk.withExtraArgument({ globalAppRegistry, instance })
        )
      );

      // TODO: clean up unneccessary global events
      globalAppRegistry.on(
        'open-instance-workspace',
        (workspace?: 'My Queries' | 'Databases' | 'Performance') => {
          store.dispatch(openWorkspace({ type: workspace ?? 'My Queries' }));
        }
      );

      globalAppRegistry.on('select-database', (namespace: string) => {
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

      globalAppRegistry.on(
        'open-namespace-in-new-tab',
        (metadata: CollectionTabPluginMetadata) => {
          openCollection(metadata, true);
        }
      );

      globalAppRegistry.on(
        'select-namespace',
        (metadata: CollectionTabPluginMetadata) => {
          openCollection(metadata, false);
        }
      );

      globalAppRegistry.on(
        'collection-renamed',
        ({ from, to }: { from: string; to: string }) => {
          store.dispatch(collectionRenamed(from, to));
        }
      );

      instance.on('remove:collections', (collection: Collection) => {
        store.dispatch(collectionRemoved(collection.ns));
      });

      instance.on('remove:databases', (database: Database) => {
        store.dispatch(databaseRemoved(database.name));
      });

      globalAppRegistry.on('menu-share-schema-json', () => {
        const activeTab = getActiveTab(store.getState());
        if (!activeTab) return;
        getLocalAppRegistryForTab(activeTab.id).emit('menu-share-schema-json');
      });

      globalAppRegistry.on('open-active-namespace-export', function () {
        const activeTab = getActiveTab(store.getState());
        if (!activeTab) return;
        globalAppRegistry.emit('open-export', {
          exportFullCollection: true,
          namespace: activeTab.namespace,
          origin: 'menu',
        });
      });

      globalAppRegistry.on('open-active-namespace-import', function () {
        const activeTab = getActiveTab(store.getState());
        if (!activeTab) return;
        globalAppRegistry.emit('open-import', {
          namespace: activeTab.namespace,
          origin: 'menu',
        });
      });

      return {
        store,
        deactivate() {
          // TODO: unsub from globalAppRegistry
        },
      };
    },
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
