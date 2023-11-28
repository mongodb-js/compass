import type AppRegistry from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { OpenWorkspaceOptions } from './stores/workspaces';
import workspacesReducer, {
  collectionRemoved,
  databaseRemoved,
  getInitialTabState,
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
          activeTabId: initialTabs[0].id,
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
        const {
          namespace,
          query,
          aggregation,
          pipelineText,
          sourcePipeline,
          editViewName,
        } = metadata;

        store.dispatch(
          openWorkspace(
            {
              type: 'Collection',
              namespace,
              initialQuery: query,
              initialAggregation: sourcePipeline ?? aggregation,
              initialPipelineText: pipelineText as string,
              editingViewNamespace: editViewName,
              metadata,
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

      instance.on('remove:collections', (collection: Collection) => {
        store.dispatch(collectionRemoved(collection.ns));
      });

      instance.on('remove:databases', (database: Database) => {
        store.dispatch(databaseRemoved(database.name));
      });

      return {
        store,
        deactivate() {
          // TODO: unsub from globalAppRegistry
        },
      };
    },
  },
  {
    instance: mongoDBInstanceLocator,
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
