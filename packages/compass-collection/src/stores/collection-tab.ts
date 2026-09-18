import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import { createStore, applyMiddleware } from 'redux';

import thunk from 'redux-thunk';
import reducer, {
  selectTab,
  collectionMetadataFetched,
  analyzeCollectionSchema,
  cancelSchemaAnalysis,
  openMockDataGeneratorModal,
  mockDataGeneratorModalClosed,
} from '../modules/collection-tab';
import { MockDataGeneratorSteps } from '../components/mock-data-generator-modal/types';
import { DEFAULT_DOCUMENT_COUNT } from '../components/mock-data-generator-modal/constants';

import type { Collection } from '@mongodb-js/compass-app-stores/provider';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { ExperimentationServices } from '@mongodb-js/compass-telemetry/provider';
import type { connectionInfoRefLocator } from '@mongodb-js/compass-connections/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { AtlasAiService } from '@mongodb-js/compass-generative-ai/provider';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import { isMockDataGeneratorEligible } from '../mock-data-generator-eligibility';
import { ExperimentTestNames } from '@mongodb-js/compass-telemetry/provider';
import {
  SCHEMA_ANALYSIS_STATE_INITIAL,
  SCHEMA_ANALYSIS_STATE_ERROR,
  SCHEMA_ANALYSIS_STATE_COMPLETE,
  SCHEMA_ANALYSIS_STATE_ANALYZING,
} from '../schema-analysis-types';
import type { CollectionState } from '../modules/collection-tab';

/**
 * Determines if collection has valid schema analysis data.
 * Returns true when analysis is complete and has processed schema data.
 */
export function selectHasSchemaAnalysisData(state: CollectionState): boolean {
  return !!(
    state.schemaAnalysis &&
    state.schemaAnalysis.status === SCHEMA_ANALYSIS_STATE_COMPLETE &&
    Object.keys(state.schemaAnalysis.processedSchema).length > 0
  );
}

/**
 * Determines if schema analysis error is of 'unsupportedState' type.
 * Used for showing specific error messages and disabling certain features.
 */
export function selectHasUnsupportedStateError(
  state: CollectionState
): boolean {
  return (
    state.schemaAnalysis?.status === SCHEMA_ANALYSIS_STATE_ERROR &&
    state.schemaAnalysis?.error?.errorType === 'unsupportedState'
  );
}

/**
 * Determines if collection appears empty (no schema data and not analyzing).
 * Used for UI states and button enabling/disabling.
 */
export function selectIsCollectionEmpty(state: CollectionState): boolean {
  return (
    state.schemaAnalysis?.status === SCHEMA_ANALYSIS_STATE_ERROR &&
    state.schemaAnalysis?.error?.errorType === 'empty'
  );
}

/**
 * Determines if schema analysis should be re-triggered after document insertion.
 * Re-triggers when collection has no valid schema analysis data (error states,
 * initial state, and completed analysis with empty schema).
 */
export function selectShouldRetriggerSchemaAnalysis(
  state: CollectionState
): boolean {
  // Don't retrigger if already analyzing
  if (state.schemaAnalysis?.status === SCHEMA_ANALYSIS_STATE_ANALYZING) {
    return false;
  }

  // Re-trigger if no valid schema data
  return !selectHasSchemaAnalysisData(state);
}

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
  atlasAiService: AtlasAiService;
  workspaces: ReturnType<typeof workspacesServiceLocator>;
  experimentationServices: ExperimentationServices;
  connectionInfoRef: ReturnType<typeof connectionInfoRefLocator>;
  logger: Logger;
  preferences: PreferencesAccess;
};

export function activatePlugin(
  { namespace, editViewName, tabId }: CollectionTabOptions,
  services: CollectionTabServices & { globalAppRegistry: AppRegistry },
  { on, cleanup, addCleanup }: ActivateHelpers
): {
  store: ReturnType<typeof createStore>;
  deactivate: () => void;
} {
  const {
    dataService,
    collection: collectionModel,
    localAppRegistry,
    globalAppRegistry,
    atlasAiService,
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

  const fakerSchemaGenerationAbortControllerRef = {
    current: undefined,
  };
  const schemaAnalysisAbortControllerRef = {
    current: undefined,
  };
  let isActive = true;
  const store = createStore(
    reducer,
    {
      workspaceTabId: tabId,
      namespace,
      metadata: null,
      editViewName,
      schemaAnalysis: {
        status: SCHEMA_ANALYSIS_STATE_INITIAL,
      },
      mockDataGenerator: {
        isModalOpen: false,
        currentStep: MockDataGeneratorSteps.SCHEMA_CONFIRMATION,
        documentCount: DEFAULT_DOCUMENT_COUNT.toString(),
      },
      fakerSchemaGeneration: {
        status: 'idle',
      },
    },
    applyMiddleware(
      thunk.withExtraArgument({
        dataService,
        collection: collectionModel,
        atlasAiService,
        workspaces,
        localAppRegistry,
        globalAppRegistry,
        experimentationServices,
        connectionInfoRef,
        logger,
        preferences,
        fakerSchemaGenerationAbortControllerRef,
        schemaAnalysisAbortControllerRef,
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

  on(localAppRegistry, 'open-mock-data-generator-modal', () => {
    void store.dispatch(openMockDataGeneratorModal());
  });

  const handleSchemaAnalysisRetrigger = () => {
    const currentState = store.getState();
    if (
      isActive &&
      isMockDataGeneratorEligible(
        currentState.metadata,
        preferences.getPreferences()
      ) &&
      selectShouldRetriggerSchemaAnalysis(currentState)
    ) {
      void store.dispatch(analyzeCollectionSchema());
    }
  };

  // Listen for document insertions to re-trigger schema analysis for previously empty collections
  on(
    globalAppRegistry,
    'document-inserted',
    (
      payload: {
        ns: string;
        view?: string;
        mode: string;
        multiple: boolean;
        docs: unknown[];
      },
      { connectionId }: { connectionId?: string } = {}
    ) => {
      // Ensure event is for the current connection and namespace
      if (
        connectionId === connectionInfoRef.current.id &&
        payload.ns === namespace
      ) {
        handleSchemaAnalysisRetrigger();
      }
    }
  );

  // Listen for import completion to re-trigger schema analysis for previously empty collections
  on(
    globalAppRegistry,
    'import-finished',
    (
      payload: {
        ns: string;
        connectionId?: string;
      },
      { connectionId }: { connectionId?: string } = {}
    ) => {
      // Ensure event is for the current connection and namespace
      if (
        connectionId === connectionInfoRef.current.id &&
        payload.ns === namespace
      ) {
        handleSchemaAnalysisRetrigger();
      }
    }
  );

  for (const preference of [
    'enableGenAIFeatures',
    'enableGenAIFeaturesAtlasOrg',
    'readOnly',
  ] as const) {
    addCleanup(
      preferences.onPreferenceValueChanged(preference, () => {
        if (
          !isMockDataGeneratorEligible(
            store.getState().metadata,
            preferences.getPreferences()
          )
        ) {
          store.dispatch(cancelSchemaAnalysis());
          store.dispatch(mockDataGeneratorModalClosed());
        } else {
          handleSchemaAnalysisRetrigger();
        }
      })
    );
  }

  void collectionModel
    .fetchMetadata({ dataService })
    .then((metadata) => {
      if (!isActive) return;
      store.dispatch(collectionMetadataFetched(metadata));
      handleSchemaAnalysisRetrigger();
    })
    .catch((error) => {
      logger.debug('Failed to fetch collection metadata', { namespace, error });
    });

  // Assign experiment for Search Activation Program P1
  // Only assign when we're connected to Atlas
  if (connectionInfoRef.current?.atlasMetadata?.clusterName) {
    void experimentationServices
      .assignExperiment(ExperimentTestNames.searchActivationProgramP1, {
        team: 'Search Web Platform',
      })
      .catch((error) => {
        logger.debug(
          'Search Activation Program P1 experiment assignment failed',
          {
            experiment: ExperimentTestNames.searchActivationProgramP1,
            namespace: namespace,
            error: error instanceof Error ? error.message : String(error),
          }
        );
      });

    void experimentationServices
      .assignExperiment(ExperimentTestNames.searchActivationProgramP2, {
        team: 'Search Web Platform',
      })
      .catch((error) => {
        logger.debug(
          'Search Activation Program P2 experiment assignment failed',
          {
            experiment: ExperimentTestNames.searchActivationProgramP2,
            namespace: namespace,
            error: error instanceof Error ? error.message : String(error),
          }
        );
      });
  }

  addCleanup(() => {
    isActive = false;
    store.dispatch(cancelSchemaAnalysis());
    store.dispatch(mockDataGeneratorModalClosed());
  });

  return {
    store,
    deactivate: cleanup,
  };
}
