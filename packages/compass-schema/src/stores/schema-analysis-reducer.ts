import type { Schema } from 'mongodb-schema';
import { isInternalFieldPath } from 'hadron-document';
import type { Action, Reducer } from 'redux';
import type { AggregateOptions } from 'mongodb';
import type { QueryBarService } from '@mongodb-js/compass-query-bar';
import { type AnalysisState } from '../constants/analysis-states';
import {
  ANALYSIS_STATE_ANALYZING,
  ANALYSIS_STATE_COMPLETE,
  ANALYSIS_STATE_ERROR,
  ANALYSIS_STATE_INITIAL,
  ANALYSIS_STATE_TIMEOUT,
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

export type SchemaAnalysisState = {
  analysisState: AnalysisState;
  errorMessage: string;
  schema: Schema | null;
  resultId: string;
};

export const enum SchemaAnalysisActions {
  analysisStarted = 'schema-service/schema-analysis/analysisStarted',
  analysisFinished = 'schema-service/schema-analysis/analysisFinished',
  analysisFailed = 'schema-service/schema-analysis/analysisFailed',
}

export type AnalysisStartedAction = {
  type: SchemaAnalysisActions.analysisStarted;
};

export type AnalysisFinishedAction = {
  type: SchemaAnalysisActions.analysisFinished;
  schema: Schema | null;
};

export type AnalysisFailedAction = {
  type: SchemaAnalysisActions.analysisFailed;
  error: Error;
};

export const schemaAnalysisReducer: Reducer<SchemaAnalysisState, Action> = (
  state = getInitialState(),
  action
) => {
  if (
    isAction<AnalysisStartedAction>(
      action,
      SchemaAnalysisActions.analysisStarted
    )
  ) {
    return {
      ...state,
      analysisState: ANALYSIS_STATE_ANALYZING,
      errorMessage: '',
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
      ...getErrorState(action.error),
      resultId: resultId(),
    };
  }

  return state;
};

function getErrorState(err: Error & { code?: number }) {
  const errorMessage = (err && err.message) || 'Unknown error';
  const errorCode = err && err.code;

  let analysisState: AnalysisState;

  if (errorCode === ERROR_CODE_MAX_TIME_MS_EXPIRED) {
    analysisState = ANALYSIS_STATE_TIMEOUT;
  } else {
    analysisState = ANALYSIS_STATE_ERROR;
  }

  return { analysisState, errorMessage };
}

function resultId(): string {
  return new UUID().toString();
}

const getInitialState = (): SchemaAnalysisState => ({
  analysisState: ANALYSIS_STATE_INITIAL,
  errorMessage: '',
  schema: null,
  resultId: resultId(),
});

export const geoLayerAdded = (
  field: string,
  layer: Layer
): SchemaThunkAction<ReturnType<typeof generateGeoQuery>> => {
  return (dispatch, getState, { geoLayersRef }) => {
    geoLayersRef.current = addLayer(
      field,
      layer as Circle | Polygon,
      geoLayersRef.current
    );
    return generateGeoQuery(geoLayersRef.current);
  };
};

export const geoLayersEdited = (
  field: string,
  layers: LayerGroup
): SchemaThunkAction<ReturnType<typeof generateGeoQuery>> => {
  return (dispatch, getState, { geoLayersRef }) => {
    layers.eachLayer((layer) => {
      dispatch(geoLayerAdded(field, layer));
    });
    return generateGeoQuery(geoLayersRef.current);
  };
};

export const geoLayersDeleted = (
  layers: LayerGroup
): SchemaThunkAction<ReturnType<typeof generateGeoQuery>> => {
  return (dispatch, getState, { geoLayersRef }) => {
    layers.eachLayer((layer) => {
      delete geoLayersRef.current[(layer as any)._leaflet_id];
    });
    return generateGeoQuery(geoLayersRef.current);
  };
};

// We track when the user cancels the analysis. We use the userCancelled
// flag to indicate if we should track, as we also automatically stop
// analysis when deactivating the plugin.
const userCancelledAnalysisAbortReason = 'Cancelled analysis';

export const stopAnalysis = (
  userCancelled = false
): SchemaThunkAction<void> => {
  return (dispatch, getState, { analysisAbortControllerRef }) => {
    if (!analysisAbortControllerRef.current) return;
    analysisAbortControllerRef.current?.abort(
      userCancelled ? userCancelledAnalysisAbortReason : undefined
    );
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

      dispatch({ type: SchemaAnalysisActions.analysisStarted });

      const schemaAccessor = await analyzeSchema(
        dataService,
        abortSignal,
        namespace,
        samplingOptions,
        driverOptions,
        logger
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
      if (
        abortSignal.aborted &&
        abortSignal.reason === userCancelledAnalysisAbortReason
      ) {
        const analysisTime = Date.now() - analysisStartTime;
        track(
          'Schema Analysis Cancelled',
          {
            analysis_time_ms: analysisTime,
            with_filter: Object.entries(query.filter ?? {}).length > 0,
          },
          connectionInfoRef.current
        );
      }

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
