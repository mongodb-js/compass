import type { Schema } from 'mongodb-schema';
import type { Action, AnyAction, Reducer } from 'redux';
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
  schemaContainsGeoData,
} from '../modules/schema-analysis';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import { openToast } from '@mongodb-js/compass-components';
import type { Circle, Layer, LayerGroup, Polygon } from 'leaflet';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import type { SchemaThunkAction } from './store';
import { UUID } from 'bson';

const DEFAULT_SAMPLE_SIZE = 1000;

const ERROR_CODE_MAX_TIME_MS_EXPIRED = 50;

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export type SchemaState = {
  analysisState: AnalysisState;
  errorMessage: string;
  schema: Schema | null;
  resultId: string;
};

export const enum SchemaActions {
  analysisStarted = 'schema-service/schema/analysisStarted',
  analysisFinished = 'schema-service/schema/analysisFinished',
  analysisFailed = 'schema-service/schema/analysisFailed',
  analysisCancelled = 'schema-service/schema/analysisCancelled',
}

export type AnalysisStartedAction = {
  type: SchemaActions.analysisStarted;
};

export type AnalysisFinishedAction = {
  type: SchemaActions.analysisFinished;
  schema: Schema | null;
};

export type AnalysisFailedAction = {
  type: SchemaActions.analysisFailed;
  error: Error;
};

const reducer: Reducer<SchemaState, Action> = (
  state = getInitialState(),
  action
) => {
  if (isAction<AnalysisStartedAction>(action, SchemaActions.analysisStarted)) {
    return {
      ...state,
      analysisState: ANALYSIS_STATE_ANALYZING,
      errorMessage: '',
      schema: null,
    };
  }

  if (
    isAction<AnalysisFinishedAction>(action, SchemaActions.analysisFinished)
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

  if (isAction<AnalysisFailedAction>(action, SchemaActions.analysisFailed)) {
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
    const { schema } = getState();
    void navigator.clipboard.writeText(JSON.stringify(schema, null, '  '));
    const hasSchema = schema !== null;
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
    const { schema } = getState();
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

/**
 * @return {Object} initial schema state.
 */
const getInitialState = (): SchemaState => ({
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

export const stopAnalysis = (): SchemaThunkAction<void> => {
  return (dispatch, getState, { abortControllerRef }) => {
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

    try {
      debug('analysis started');

      abortControllerRef.current = new AbortController();
      const abortSignal = abortControllerRef.current.signal;

      dispatch({ type: SchemaActions.analysisStarted });

      const analysisStartTime = Date.now();
      const schema = await analyzeSchema(
        dataService,
        abortSignal,
        namespace,
        samplingOptions,
        driverOptions,
        logger
      );
      const analysisTime = Date.now() - analysisStartTime;

      if (schema !== null) {
        fieldStoreService.updateFieldsFromSchema(namespace, schema);
      }

      dispatch({ type: SchemaActions.analysisFinished, schema });

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
      dispatch({ type: SchemaActions.analysisFailed, error: err as Error });
    } finally {
      abortControllerRef.current = undefined;
    }
  };
};

export default reducer;
