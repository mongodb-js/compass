import type { Reducer, AnyAction, Action } from 'redux';
import { analyzeDocuments, type Schema } from 'mongodb-schema';

import type { CollectionMetadata } from 'mongodb-collection-model';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { experimentationServiceLocator } from '@mongodb-js/compass-telemetry/provider';
import { type Logger, mongoLogId } from '@mongodb-js/compass-logging/provider';
import { type PreferencesAccess } from 'compass-preferences-model/provider';
import { isInternalFieldPath } from 'hadron-document';
import toNS from 'mongodb-ns';
import {
  SCHEMA_ANALYSIS_STATE_ANALYZING,
  SCHEMA_ANALYSIS_STATE_COMPLETE,
  SCHEMA_ANALYSIS_STATE_ERROR,
  SCHEMA_ANALYSIS_STATE_INITIAL,
  type SchemaAnalysisError,
  type SchemaAnalysisState,
} from '../schema-analysis-types';
import { calculateSchemaDepth } from '../calculate-schema-depth';
import type { Document, MongoError } from 'mongodb';

const DEFAULT_SAMPLE_SIZE = 100;

const NO_DOCUMENTS_ERROR = 'No documents found in the collection to analyze.';

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

const ERROR_CODE_MAX_TIME_MS_EXPIRED = 50;

function getErrorDetails(error: Error): SchemaAnalysisError {
  const errorCode = (error as MongoError).code;
  const errorMessage = error.message || 'Unknown error';
  let errorType: SchemaAnalysisError['errorType'] = 'general';
  if (errorCode === ERROR_CODE_MAX_TIME_MS_EXPIRED) {
    errorType = 'timeout';
  } else if (error.message.includes('Schema analysis aborted: Fields count')) {
    errorType = 'highComplexity';
  }

  return {
    errorType,
    errorMessage,
  };
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
  },
  A
>;

export type CollectionState = {
  workspaceTabId: string;
  namespace: string;
  metadata: CollectionMetadata | null;
  editViewName?: string;
  schemaAnalysis: SchemaAnalysisState;
};

enum CollectionActions {
  CollectionMetadataFetched = 'compass-collection/CollectionMetadataFetched',
  SchemaAnalysisStarted = 'compass-collection/SchemaAnalysisStarted',
  SchemaAnalysisFinished = 'compass-collection/SchemaAnalysisFinished',
  SchemaAnalysisFailed = 'compass-collection/SchemaAnalysisFailed',
  SchemaAnalysisReset = 'compass-collection/SchemaAnalysisReset',
}

interface CollectionMetadataFetchedAction {
  type: CollectionActions.CollectionMetadataFetched;
  metadata: CollectionMetadata;
}

interface SchemaAnalysisResetAction {
  type: CollectionActions.SchemaAnalysisReset;
}

interface SchemaAnalysisStartedAction {
  type: CollectionActions.SchemaAnalysisStarted;
}

interface SchemaAnalysisFinishedAction {
  type: CollectionActions.SchemaAnalysisFinished;
  schema: Schema;
  sampleDocument: Document;
  schemaMetadata: {
    maxNestingDepth: number;
    validationRules: Document | null;
  };
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
      status: SCHEMA_ANALYSIS_STATE_INITIAL,
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
    isAction<SchemaAnalysisResetAction>(
      action,
      CollectionActions.SchemaAnalysisReset
    )
  ) {
    return {
      ...state,
      schemaAnalysis: {
        status: SCHEMA_ANALYSIS_STATE_INITIAL,
      },
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
        status: SCHEMA_ANALYSIS_STATE_ANALYZING,
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
      schemaAnalysis: {
        status: SCHEMA_ANALYSIS_STATE_COMPLETE,
        schema: action.schema,
        sampleDocument: action.sampleDocument,
        schemaMetadata: action.schemaMetadata,
      },
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
        status: SCHEMA_ANALYSIS_STATE_ERROR,
        error: getErrorDetails(action.error),
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

export const analyzeCollectionSchema = (): CollectionThunkAction<
  Promise<void>
> => {
  return async (dispatch, getState, { dataService, preferences, logger }) => {
    const { schemaAnalysis, namespace } = getState();
    const analysisStatus = schemaAnalysis.status;
    if (analysisStatus === SCHEMA_ANALYSIS_STATE_ANALYZING) {
      logger.debug(
        'Schema analysis is already in progress, skipping new analysis.'
      );
      return;
    }

    try {
      logger.debug('Schema analysis started.');

      dispatch({
        type: CollectionActions.SchemaAnalysisStarted,
      });

      // Sample documents
      const samplingOptions = { size: DEFAULT_SAMPLE_SIZE };
      const driverOptions = {
        maxTimeMS: preferences.getPreferences().maxTimeMS,
      };
      const sampleDocuments = await dataService.sample(
        namespace,
        samplingOptions,
        driverOptions,
        {
          fallbackReadPreference: 'secondaryPreferred',
        }
      );
      if (sampleDocuments.length === 0) {
        logger.debug(NO_DOCUMENTS_ERROR);
        dispatch({
          type: CollectionActions.SchemaAnalysisFailed,
          error: new Error(NO_DOCUMENTS_ERROR),
        });
        return;
      }

      // Analyze sampled documents
      const schemaAccessor = await analyzeDocuments(sampleDocuments);
      const schema = await schemaAccessor.getInternalSchema();

      // Filter out internal fields from the schema
      schema.fields = schema.fields.filter(
        ({ path }) => !isInternalFieldPath(path[0])
      );
      // TODO: Transform schema to structure that will be used by the LLM.

      const maxNestingDepth = await calculateSchemaDepth(schema);
      const { database, collection } = toNS(namespace);
      const collInfo = await dataService.collectionInfo(database, collection);
      const validationRules = collInfo?.validation?.validator ?? null;
      const schemaMetadata = {
        maxNestingDepth,
        validationRules,
      };
      dispatch({
        type: CollectionActions.SchemaAnalysisFinished,
        schema,
        sampleDocument: sampleDocuments[0],
        schemaMetadata,
      });
    } catch (err: any) {
      logger.log.error(
        mongoLogId(1_001_000_363),
        'Collection',
        'Schema analysis failed',
        {
          namespace,
          error: err.message,
        }
      );
      dispatch({
        type: CollectionActions.SchemaAnalysisFailed,
        error: err as Error,
      });
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
