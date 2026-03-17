import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import { createStore, applyMiddleware } from 'redux';

import thunk from 'redux-thunk';
import reducer, {
  selectTab,
  collectionMetadataFetched,
  analyzeCollectionSchema,
  cancelSchemaAnalysis,
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
import {
  isAIFeatureEnabled,
  type PreferencesAccess,
} from 'compass-preferences-model/provider';
import {
  ExperimentTestNames,
  ExperimentTestGroups,
} from '@mongodb-js/compass-telemetry/provider';
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

/**
 * Checks if user is in Mock Data Generator experiment variant.
 * Returns false on error to default to not running schema analysis.
 */
async function shouldRunSchemaAnalysis(
  experimentationServices: ExperimentationServices,
  logger: Logger,
  namespace: string
): Promise<boolean> {
  try {
    const assignment = await experimentationServices.getAssignment(
      ExperimentTestNames.mockDataGenerator,
      false // Don't track "Experiment Viewed" event here
    );
    return (
      assignment?.assignmentData?.variant ===
      ExperimentTestGroups.mockDataGeneratorVariant
    );
  } catch (error) {
    // On error, default to not running schema analysis
    logger.debug('Failed to get Mock Data Generator experiment assignment', {
      experiment: ExperimentTestNames.mockDataGenerator,
      namespace: namespace,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
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

  const handleSchemaAnalysisRetrigger = (eventType: string) => {
    const currentState = store.getState();
    if (selectShouldRetriggerSchemaAnalysis(currentState)) {
      // Check if user is in Mock Data Generator experiment variant before re-triggering
      shouldRunSchemaAnalysis(experimentationServices, logger, namespace)
        .then((shouldRun) => {
          if (shouldRun) {
            logger.debug(`Re-triggering schema analysis after ${eventType}`, {
              namespace,
            });
            void store.dispatch(analyzeCollectionSchema());
          }
        })
        .catch((error) => {
          logger.debug('Error checking schema analysis experiment', {
            namespace: namespace,
            error: error instanceof Error ? error.message : String(error),
          });
        });
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
        handleSchemaAnalysisRetrigger('document insertion');
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
        handleSchemaAnalysisRetrigger('import finished');
      }
    }
  );

  void collectionModel.fetchMetadata({ dataService }).then((metadata) => {
    store.dispatch(collectionMetadataFetched(metadata));

    // Assign experiment for Mock Data Generator
    // Only assign when we're connected to Atlas, the org-level setting for AI features is enabled,
    // and the collection supports the Mock Data Generator feature (not readonly/timeseries)
    if (
      !metadata.isReadonly &&
      !metadata.isTimeSeries &&
      connectionInfoRef.current?.atlasMetadata?.clusterName && // Ensures we only assign in Atlas
      isAIFeatureEnabled(preferences.getPreferences()) // Ensures org-level AI features setting is enabled
    ) {
      void experimentationServices
        .assignExperiment(ExperimentTestNames.mockDataGenerator, {
          team: 'Atlas Growth',
        })
        .catch((error) => {
          logger.debug('Mock Data Generator experiment assignment failed', {
            experiment: ExperimentTestNames.mockDataGenerator,
            namespace: namespace,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }

    if (!metadata.isReadonly && !metadata.isTimeSeries) {
      // Check experiment variant before running schema analysis
      // Only run schema analysis if user is in treatment variant
      void shouldRunSchemaAnalysis(
        experimentationServices,
        logger,
        namespace
      ).then((shouldRun) => {
        if (shouldRun) {
          void store.dispatch(analyzeCollectionSchema());
        }
      });
    }
  });

  // Cancel schema analysis when plugin is deactivated
  addCleanup(() => store.dispatch(cancelSchemaAnalysis()));

  return {
    store,
    deactivate: cleanup,
  };
}
