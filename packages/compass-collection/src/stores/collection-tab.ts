import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, {
  selectTab,
  collectionMetadataFetched,
} from '../modules/collection-tab';
import type { Collection } from '@mongodb-js/compass-app-stores/provider';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { experimentationServiceLocator } from '@mongodb-js/compass-telemetry';
import type { connectionInfoRefLocator } from '@mongodb-js/compass-connections/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';

export type CollectionTabOptions = {
  /**
   * Workspace Tab ID
   */
  tabId: string;
  /**
   * Collection namespace
   */
  namespace: string;
  /**
   * View namespace that can be passed when editing view pipeline in the source
   * collection
   */
  editViewName?: string;
};

export type CollectionTabServices = {
  dataService: DataService;
  collection: Collection;
  localAppRegistry: AppRegistry;
  workspaces: ReturnType<typeof workspacesServiceLocator>;
  experimentationServices: ReturnType<typeof experimentationServiceLocator>;
  connectionInfoRef: ReturnType<typeof connectionInfoRefLocator>;
  logger: Logger;
};

export function activatePlugin(
  { namespace, editViewName, tabId }: CollectionTabOptions,
  services: CollectionTabServices,
  { on, cleanup }: ActivateHelpers
): {
  store: ReturnType<typeof createStore>;
  deactivate: () => void;
} {
  const {
    dataService,
    collection: collectionModel,
    localAppRegistry,
    workspaces,
    experimentationServices,
    connectionInfoRef,
    logger,
  } = services;

  if (!collectionModel) {
    throw new Error(
      "Can't activate collection tab plugin without collection model"
    );
  }

  const store = createStore(
    reducer,
    {
      workspaceTabId: tabId,
      namespace,
      metadata: null,
      editViewName,
    },
    applyMiddleware(
      thunk.withExtraArgument({
        dataService,
        workspaces,
        localAppRegistry,
        experimentationServices,
      })
    )
  );

  on(localAppRegistry, 'open-create-index-modal', () => {
    store.dispatch(selectTab('Indexes'));
  });

  on(localAppRegistry, 'open-create-search-index-modal', () => {
    store.dispatch(selectTab('Indexes'));
  });

  on(localAppRegistry, 'generate-aggregation-from-query', () => {
    store.dispatch(selectTab('Aggregations'));
  });

  on(localAppRegistry, 'menu-share-schema-json', () => {
    store.dispatch(selectTab('Schema'));
  });

  void collectionModel.fetchMetadata({ dataService }).then((metadata) => {
    store.dispatch(collectionMetadataFetched(metadata));

    // Assign experiment for Mock Data Generator (Atlas-only)
    if (
      experimentationServices &&
      experimentationServices.assignExperiment &&
      connectionInfoRef.current?.atlasMetadata?.clusterName // Ensures we only assign in Atlas
    ) {
      void experimentationServices
        .assignExperiment('mock-data-generator', {
          team: 'data-explorer',
        })
        .catch((error) => {
          logger.debug('Mock Data Generator experiment assignment failed', {
            experiment: 'mock-data-generator',
            namespace: namespace,
            error: error.message,
          });
        });
    }
  });

  return {
    store,
    deactivate: cleanup,
  };
}
