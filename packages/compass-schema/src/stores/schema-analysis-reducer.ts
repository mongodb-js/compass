import type { Schema, InternalSchema } from 'mongodb-schema';
import { isInternalFieldPath } from 'hadron-document';
import type { Action, Reducer } from 'redux';
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
  calculateSchemaDepth,
  type SchemaAccessor,
  schemaContainsGeoData,
} from '../modules/schema-analysis';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import { openToast } from '@mongodb-js/compass-components';
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
  schemaAccessor: SchemaAccessor | null;
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
  schemaAccessor: SchemaAccessor | null;
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
      schemaAccessor: null,
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
      schemaAccessor: action.schemaAccessor,
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

export const handleSchemaShare = (): SchemaThunkAction<void> => {
  return (dispatch, getState, { namespace }) => {
    const {
      schemaAnalysis: { schema },
    } = getState();
    const hasSchema = schema !== null;
    if (hasSchema) {
      void navigator.clipboard.writeText(JSON.stringify(schema, null, '  '));
    }
    dispatch(_trackSchemaShared(hasSchema));
    openToast(
      'share-schema',
      hasSchema
        ? {
            variant: 'success',
            title: 'Schema Copied',
            description: `The schema definition of ${namespace} has been copied to your clipboard in JSON format.`,
            timeout: 5_000,
          }
        : {
            variant: 'warning',
            title: 'Analyze Schema First',
            description: 'Please Analyze the Schema First from the Schema Tab.',
            timeout: 5_000,
          }
    );
  };
};

export const _trackSchemaShared = (
  hasSchema: boolean
): SchemaThunkAction<void> => {
  return (dispatch, getState, { track, connectionInfoRef }) => {
    const {
      schemaAnalysis: { schema },
    } = getState();
    // Use a function here to a) ensure that the calculations here
    // are only made when telemetry is enabled and b) that errors from
    // those calculations are caught and logged rather than displayed to
    // users as errors from the core schema sharing logic.
    const trackEvent = () => ({
      has_schema: hasSchema,
      schema_width: schema?.fields?.length ?? 0,
      schema_depth: schema ? calculateSchemaDepth(schema) : 0,
      geo_data: schema ? schemaContainsGeoData(schema) : false,
    });
    track('Schema Exported', trackEvent, connectionInfoRef.current);
  };
};

const getInitialState = (): SchemaAnalysisState => ({
  analysisState: ANALYSIS_STATE_INITIAL,
  errorMessage: '',
  schema: null,
  schemaAccessor: null,
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

export const stopAnalysis = (): SchemaThunkAction<void> => {
  return (dispatch, getState, { abortControllerRef }) => {
    if (!abortControllerRef.current) return;
    abortControllerRef.current?.abort();
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
      abortControllerRef,
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

    const driverOptions = {
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(preferences, query.maxTimeMS),
    };

    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    try {
      debug('analysis started');

      dispatch({ type: SchemaAnalysisActions.analysisStarted });

      const analysisStartTime = Date.now();
      const schemaAccessor = await analyzeSchema(
        dataService,
        abortSignal,
        namespace,
        samplingOptions,
        driverOptions,
        logger
      );
      let schema: InternalSchema | null = null;
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
        schemaAccessor,
      });

      // track schema analyzed
      const trackEvent = () => ({
        with_filter: Object.entries(query.filter ?? {}).length > 0,
        schema_width: schema?.fields?.length ?? 0,
        schema_depth: schema ? calculateSchemaDepth(schema) : 0,
        geo_data: schema ? schemaContainsGeoData(schema) : false,
        analysis_time_ms: analysisTime,
      });
      track('Schema Analyzed', trackEvent, connectionInfoRef.current);

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
      abortControllerRef.current = undefined;
    }
  };
};
