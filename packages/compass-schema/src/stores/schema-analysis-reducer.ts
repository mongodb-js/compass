import type { Schema } from 'mongodb-schema';
import { isInternalFieldPath } from 'hadron-document';
import type { Action, Reducer } from 'redux';
import type { AggregateOptions, MongoError } from 'mongodb';
import type { QueryBarService } from '@mongodb-js/compass-query-bar';
import { type AnalysisState } from '../constants/analysis-states';
import {
  ANALYSIS_STATE_ANALYZING,
  ANALYSIS_STATE_COMPLETE,
  ANALYSIS_STATE_INITIAL,
} from '../constants/analysis-states';
import { addLayer, generateGeoQuery } from '../modules/geo';
import {
  analyzeSchema,
  calculateSchemaMetadata,
} from '../modules/schema-analysis';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import type { Circle, Layer, LayerGroup, Polygon } from 'leaflet';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import type { SchemaThunkAction } from './store';
import { UUID } from 'bson';
import { isAction } from '../utils';

const DEFAULT_SAMPLE_SIZE = 1000;

const ERROR_CODE_MAX_TIME_MS_EXPIRED = 50;

export type SchemaAnalysisError = {
  errorMessage: string;
  errorType: 'timeout' | 'highComplexity' | 'general';
};

export type SchemaAnalysisState = {
  analysisState: AnalysisState;
  analysisStartTime?: number;
  error?: SchemaAnalysisError;
  schema: Schema | null;
  resultId: string;
};

export const enum SchemaAnalysisActions {
  analysisStarted = 'schema-service/schema-analysis/analysisStarted',
  analysisFinished = 'schema-service/schema-analysis/analysisFinished',
  analysisFailed = 'schema-service/schema-analysis/analysisFailed',
  analysisErrorDismissed = 'schema-service/schema-analysis/analysisErrorDismissed',
}

export type AnalysisStartedAction = {
  type: SchemaAnalysisActions.analysisStarted;
  analysisStartTime: number;
};

export type AnalysisFinishedAction = {
  type: SchemaAnalysisActions.analysisFinished;
  schema: Schema | null;
};

export type AnalysisFailedAction = {
  type: SchemaAnalysisActions.analysisFailed;
  error: Error;
};

export type AnalysisErrorDismissedAction = {
  type: SchemaAnalysisActions.analysisErrorDismissed;
};

export const schemaAnalysisReducer: Reducer<SchemaAnalysisState, Action> = (
  state = getInitialState(),
  action
): SchemaAnalysisState => {
  if (
    isAction<AnalysisStartedAction>(
      action,
      SchemaAnalysisActions.analysisStarted
    )
  ) {
    return {
      ...state,
      analysisStartTime: action.analysisStartTime,
      analysisState: ANALYSIS_STATE_ANALYZING,
      error: undefined,
      schema: null,
    };
  }

  if (
    isAction<AnalysisFinishedAction>(
      action,
      SchemaAnalysisActions.analysisFinished
    )
  ) {
    return {
      ...state,
      analysisState: action.schema
        ? ANALYSIS_STATE_COMPLETE
        : ANALYSIS_STATE_INITIAL,
      schema: action.schema,
      resultId: resultId(),
    };
  }

  if (
    isAction<AnalysisFailedAction>(action, SchemaAnalysisActions.analysisFailed)
  ) {
    return {
      ...state,
      error: getErrorDetails(action.error),
      analysisState: ANALYSIS_STATE_INITIAL,
      resultId: resultId(),
    };
  }

  if (
    isAction<AnalysisErrorDismissedAction>(
      action,
      SchemaAnalysisActions.analysisErrorDismissed
    )
  ) {
    return {
      ...state,
      error: undefined,
    };
  }

  return state;
};

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

function resultId(): string {
  return new UUID().toString();
}

const getInitialState = (): SchemaAnalysisState => ({
  analysisState: ANALYSIS_STATE_INITIAL,
  schema: null,
  resultId: resultId(),
});

export const geoLayerAdded = (
  field: string,
  layer: Layer,
  onAdded: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
): SchemaThunkAction<void> => {
  return (dispatch, getState, { geoLayersRef }) => {
    geoLayersRef.current = addLayer(
      field,
      layer as Circle | Polygon,
      geoLayersRef.current
    );
    onAdded(generateGeoQuery(geoLayersRef.current));
  };
};

export const analysisErrorDismissed =
  (): SchemaThunkAction<AnalysisErrorDismissedAction> => {
    return (dispatch) =>
      dispatch({ type: SchemaAnalysisActions.analysisErrorDismissed });
  };

export const geoLayersEdited = (
  field: string,
  layers: LayerGroup,
  onEdited: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
): SchemaThunkAction<void> => {
  return (dispatch, getState, { geoLayersRef }) => {
    layers.eachLayer((layer) => {
      dispatch(
        geoLayerAdded(field, layer, () => {
          // noop, we will call `onEdited` when we're done with updates
        })
      );
    });
    onEdited(generateGeoQuery(geoLayersRef.current));
  };
};

export const geoLayersDeleted = (
  layers: LayerGroup,
  onDeleted: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
): SchemaThunkAction<void> => {
  return (dispatch, getState, { geoLayersRef }) => {
    layers.eachLayer((layer) => {
      delete geoLayersRef.current[(layer as any)._leaflet_id];
    });
    onDeleted(generateGeoQuery(geoLayersRef.current));
  };
};

export const stopAnalysis = (): SchemaThunkAction<void> => {
  return (
    dispatch,
    getState,
    { analysisAbortControllerRef, connectionInfoRef, queryBar, track }
  ) => {
    if (!analysisAbortControllerRef.current) return;
    const analysisTime =
      Date.now() - (getState().schemaAnalysis.analysisStartTime ?? 0);

    const query = queryBar.getLastAppliedQuery('schema');
    track(
      'Schema Analysis Cancelled',
      {
        analysis_time_ms: analysisTime,
        with_filter: Object.entries(query.filter ?? {}).length > 0,
      },
      connectionInfoRef.current
    );

    analysisAbortControllerRef.current?.abort('Analysis cancelled');
  };
};

export const cleanupAnalysis = (): SchemaThunkAction<void> => {
  return (dispatch, getState, { analysisAbortControllerRef }) => {
    if (!analysisAbortControllerRef.current) return;
    analysisAbortControllerRef.current?.abort();
  };
};

const getSchemaAnalyzedEventPayload = ({
  schema,
  query,
  analysisTime,
}: {
  schema: Schema | null;
  query: ReturnType<QueryBarService['getLastAppliedQuery']>;
  analysisTime: number;
}) => {
  return async () => {
    const {
      field_types,
      geo_data,
      optional_field_count,
      schema_depth,
      variable_type_count,
    } = schema
      ? await calculateSchemaMetadata(schema)
      : {
          field_types: {},
          geo_data: false,
          optional_field_count: 0,
          schema_depth: 0,
          variable_type_count: 0,
        };

    return {
      with_filter: Object.entries(query.filter ?? {}).length > 0,
      schema_width: schema?.fields?.length ?? 0,
      field_types,
      variable_type_count,
      optional_field_count,
      schema_depth,
      geo_data,
      analysis_time_ms: analysisTime,
    };
  };
};

export const startAnalysis = (): SchemaThunkAction<
  Promise<void>,
  AnalysisStartedAction | AnalysisFinishedAction | AnalysisFailedAction
> => {
  return async (
    dispatch,
    getState,
    {
      queryBar,
      preferences,
      logger: { debug, log },
      dataService,
      logger,
      fieldStoreService,
      analysisAbortControllerRef,
      schemaAccessorRef,
      namespace,
      geoLayersRef,
      connectionInfoRef,
      track,
    }
  ) => {
    const {
      schemaAnalysis: { analysisState },
    } = getState();
    if (analysisState === ANALYSIS_STATE_ANALYZING) {
      debug('analysis already in progress. ignoring subsequent start');
      return;
    }
    const query = queryBar.getLastAppliedQuery('schema');

    const sampleSize = query.limit
      ? Math.min(DEFAULT_SAMPLE_SIZE, query.limit)
      : DEFAULT_SAMPLE_SIZE;

    const samplingOptions = {
      query: query.filter ?? {},
      size: sampleSize,
      fields: query.project ?? undefined,
    };

    const driverOptions: AggregateOptions = {
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(preferences, query.maxTimeMS),
    };

    analysisAbortControllerRef.current = new AbortController();
    const abortSignal = analysisAbortControllerRef.current.signal;

    const analysisStartTime = Date.now();
    try {
      debug('analysis started');

      dispatch({
        type: SchemaAnalysisActions.analysisStarted,
        analysisStartTime,
      });

      const schemaAccessor = await analyzeSchema(
        dataService,
        abortSignal,
        namespace,
        samplingOptions,
        driverOptions,
        logger,
        preferences
      );
      if (abortSignal?.aborted) {
        throw new Error(abortSignal?.reason || new Error('Operation aborted'));
      }

      schemaAccessorRef.current = schemaAccessor;
      let schema: Schema | null = null;
      if (schemaAccessor) {
        schema = await schemaAccessor.getInternalSchema();
        schema.fields = schema.fields.filter(
          ({ path }) => !isInternalFieldPath(path[0])
        );
      }
      const analysisTime = Date.now() - analysisStartTime;

      if (schema !== null) {
        fieldStoreService.updateFieldsFromSchema(namespace, schema);
      }

      dispatch({
        type: SchemaAnalysisActions.analysisFinished,
        schema,
      });

      track(
        'Schema Analyzed',
        getSchemaAnalyzedEventPayload({
          schema,
          query,
          analysisTime,
        }),
        connectionInfoRef.current
      );

      geoLayersRef.current = {};
    } catch (err: any) {
      log.error(
        mongoLogId(1_001_000_188),
        'Schema analysis',
        'Error sampling schema',
        {
          error: err.stack,
        }
      );
      dispatch({
        type: SchemaAnalysisActions.analysisFailed,
        error: err as Error,
      });
    } finally {
      analysisAbortControllerRef.current = undefined;
    }
  };
};
