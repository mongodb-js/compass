import type { Reducer, AnyAction, Action } from 'redux';
import {
  analyzeDocuments,
  SchemaParseOptions,
  type Schema,
} from 'mongodb-schema';

import type { CollectionMetadata } from 'mongodb-collection-model';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { experimentationServiceLocator } from '@mongodb-js/compass-telemetry/provider';
import { calculateSchemaMetadata } from '@mongodb-js/compass-schema';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { type PreferencesAccess } from 'compass-preferences-model/provider';
import { isInternalFieldPath } from 'hadron-document';
import { mongoLogId } from '@mongodb-js/compass-logging';
import toNS from 'mongodb-ns';

const DEFAULT_SAMPLE_SIZE = 100;

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

type CollectionThunkAction<R, A extends AnyAction = AnyAction> = ThunkAction<
  R,
  CollectionState,
  {
    localAppRegistry: AppRegistry;
    dataService: DataService;
    workspaces: ReturnType<typeof workspacesServiceLocator>;
    experimentationServices: ReturnType<typeof experimentationServiceLocator>;
    logger: Logger;
    preferences: PreferencesAccess;
    analysisAbortControllerRef: { current?: AbortController };
  },
  A
>;

export enum SchemaAnalysisStatus {
  INITIAL = 'initial',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

type SchemaAnalysis = {
  status: SchemaAnalysisStatus;
  schema: Schema | null;
  sampleDocument: Document | null;
  schemaMetadata: {
    maxNestingDepth: number;
    validationRules: Document;
  } | null;
  error: string | null;
};

export type CollectionState = {
  workspaceTabId: string;
  namespace: string;
  metadata: CollectionMetadata | null;
  editViewName?: string;
  schemaAnalysis: SchemaAnalysis;
};

export enum CollectionActions {
  CollectionMetadataFetched = 'compass-collection/CollectionMetadataFetched',
  SchemaAnalysisStarted = 'compass-collection/SchemaAnalysisStarted',
  SchemaAnalysisFinished = 'compass-collection/SchemaAnalysisFinished',
  SchemaAnalysisFailed = 'compass-collection/SchemaAnalysisFailed',
}

interface CollectionMetadataFetchedAction {
  type: CollectionActions.CollectionMetadataFetched;
  metadata: CollectionMetadata;
}

interface SchemaAnalysisStartedAction {
  type: CollectionActions.SchemaAnalysisStarted;
  analysisStartTime: number;
}

interface SchemaAnalysisFinishedAction {
  type: CollectionActions.SchemaAnalysisFinished;
  schemaAnalysis: SchemaAnalysis;
}

interface SchemaAnalysisFailedAction {
  type: CollectionActions.SchemaAnalysisFailed;
  error: Error;
}

const reducer: Reducer<CollectionState, Action> = (
  state = {
    // TODO(COMPASS-7782): use hook to get the workspace tab id instead
    workspaceTabId: '',
    namespace: '',
    metadata: null,
    schemaAnalysis: {
      status: SchemaAnalysisStatus.INITIAL,
      schema: null,
      sampleDocument: null,
      schemaMetadata: null,
      error: null,
    },
  },
  action
) => {
  if (
    isAction<CollectionMetadataFetchedAction>(
      action,
      CollectionActions.CollectionMetadataFetched
    )
  ) {
    return {
      ...state,
      metadata: action.metadata,
    };
  }

  if (
    isAction<SchemaAnalysisStartedAction>(
      action,
      CollectionActions.SchemaAnalysisStarted
    )
  ) {
    return {
      ...state,
      schemaAnalysis: {
        status: SchemaAnalysisStatus.ANALYZING,
        schema: null,
        sampleDocument: null,
        schemaMetadata: null,
        error: null,
      },
    };
  }

  if (
    isAction<SchemaAnalysisFinishedAction>(
      action,
      CollectionActions.SchemaAnalysisFinished
    )
  ) {
    return {
      ...state,
      schemaAnalysis: action.schemaAnalysis,
    };
  }

  if (
    isAction<SchemaAnalysisFailedAction>(
      action,
      CollectionActions.SchemaAnalysisFailed
    )
  ) {
    return {
      ...state,
      schemaAnalysis: {
        ...state.schemaAnalysis,
        status: SchemaAnalysisStatus.ERROR,
        error: action.error.message,
      },
    };
  }

  return state;
};

export const collectionMetadataFetched = (
  metadata: CollectionMetadata
): CollectionMetadataFetchedAction => {
  return { type: CollectionActions.CollectionMetadataFetched, metadata };
};

export const selectTab = (
  tabName: CollectionSubtab
): CollectionThunkAction<void> => {
  return (_dispatch, getState, { workspaces }) => {
    workspaces.openCollectionWorkspaceSubtab(
      getState().workspaceTabId,
      tabName
    );
  };
};

export const analyzeCollectionSchema = (): CollectionThunkAction<void> => {
  return async (
    dispatch,
    getState,
    { analysisAbortControllerRef, dataService, preferences, logger }
  ) => {
    const { schemaAnalysis, namespace } = getState();
    const analysisStatus = schemaAnalysis.status;
    if (analysisStatus === SchemaAnalysisStatus.ANALYZING) {
      logger.debug(
        'Schema analysis is already in progress, skipping new analysis.'
      );
      return;
    }

    analysisAbortControllerRef.current = new AbortController();
    const abortSignal = analysisAbortControllerRef.current.signal;

    const analysisStartTime = Date.now();

    try {
      logger.debug('Schema analysis started.');

      dispatch({
        type: CollectionActions.SchemaAnalysisStarted,
        analysisStartTime,
      });

      // Sample documents
      const samplingOptions = { size: DEFAULT_SAMPLE_SIZE };
      const driverOptions = {
        maxTimeMS: preferences.getPreferences().maxTimeMS,
        signal: abortSignal,
      };
      const sampleCursor = dataService.sampleCursor(
        namespace,
        samplingOptions,
        driverOptions,
        {
          fallbackReadPreference: 'secondaryPreferred',
        }
      );
      const sampleDocuments = await sampleCursor.toArray();

      // Analyze sampled documents
      const schemaParseOptions: SchemaParseOptions = {
        signal: abortSignal,
      };
      const schemaAccessor = await analyzeDocuments(
        sampleDocuments,
        schemaParseOptions
      );
      if (abortSignal?.aborted) {
        throw new Error(abortSignal?.reason || new Error('Operation aborted'));
      }

      let schema: Schema | null = null;
      if (schemaAccessor) {
        schema = await schemaAccessor.getInternalSchema();
        // Filter out internal fields from the schema
        schema.fields = schema.fields.filter(
          ({ path }) => !isInternalFieldPath(path[0])
        );
        // TODO: Transform schema to structure that will be used by the LLM.
      }

      let schemaMetadata = null;
      if (schema !== null) {
        const { schema_depth } = await calculateSchemaMetadata(schema);
        const { database, collection } = toNS(namespace);
        const collInfo = await dataService.collectionInfo(database, collection);
        schemaMetadata = {
          maxNestingDepth: schema_depth,
          validationRules: collInfo?.validation?.validator || null,
        };
      }
      dispatch({
        type: CollectionActions.SchemaAnalysisFinished,
        schemaAnalysis: {
          status: SchemaAnalysisStatus.COMPLETED,
          schema,
          sampleDocument: sampleDocuments[0] ?? null,
          schemaMetadata,
        },
      });
    } catch (err: any) {
      logger.log.error(
        mongoLogId(1_001_000_363),
        'Collection',
        'Schema analysis failed',
        {
          namespace,
          error: err.message,
          aborted: abortSignal.aborted,
          ...(abortSignal.aborted
            ? { abortReason: abortSignal.reason?.message ?? abortSignal.reason }
            : {}),
        }
      );
      dispatch({
        type: CollectionActions.SchemaAnalysisFailed,
        error: err as Error,
      });
    } finally {
      analysisAbortControllerRef.current = undefined;
    }
  };
};

export type CollectionTabPluginMetadata = CollectionMetadata & {
  /**
   * Initial query for the query bar
   */
  query?: unknown;
  /**
   * Stored pipeline metadata. Can be provided to preload stored pipeline
   * right when the plugin is initialized
   */
  aggregation?: unknown;
  /**
   * Initial pipeline that will be converted to a string to be used by the
   * aggregation builder. Takes precedence over `pipelineText` option
   */
  pipeline?: unknown[];
  /**
   * Initial pipeline text to be used by the aggregation builder
   */
  pipelineText?: string;
  /**
   * Namespace for the view that is being edited. Needs to be provided with the
   * `pipeline` options
   */
  editViewName?: string;
};

export default reducer;
