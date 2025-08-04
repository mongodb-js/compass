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
import {
  isAIFeatureEnabled,
  type PreferencesAccess,
} from 'compass-preferences-model/provider';
import { TestName } from '../../../compass-telemetry/src/growth-experiments';

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
  preferences: PreferencesAccess;
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
    preferences,
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

    // Assign experiment for Mock Data Generator:
    // Only assign when experimentationServices.assignExperiment is initialized,
    // we're connected to Atlas,
    // and the org-level setting for AI features is enabled
    if (
      experimentationServices?.assignExperiment && // Ensures experimentation services are available
      connectionInfoRef.current?.atlasMetadata?.clusterName && // Ensures we only assign in Atlas
      isAIFeatureEnabled(preferences.getPreferences()) // Ensures org-level AI features setting is enabled
    ) {
      void experimentationServices
        .assignExperiment(TestName.mockDataGenerator, {
          team: 'Atlas Growth',
        })
        .catch((error) => {
          logger.debug('Mock Data Generator experiment assignment failed', {
            experiment: TestName.mockDataGenerator,
            namespace: namespace,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }
  });

  return {
    store,
    deactivate: cleanup,
  };
}
