import type { Schema } from 'mongodb-schema';
import type { Action, AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { type AnalysisState } from '../constants/analysis-states';
import {
  ANALYSIS_STATE_ANALYZING,
  ANALYSIS_STATE_COMPLETE,
  ANALYSIS_STATE_ERROR,
  ANALYSIS_STATE_INITIAL,
  ANALYSIS_STATE_TIMEOUT,
} from '../constants/analysis-states';

import type { Query } from '@mongodb-js/compass-query-bar';
import type { InternalLayer } from '../modules/geo';
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
  resultId: number;
  abortController: undefined | AbortController;
  ns: string;
  geoLayers: Record<string, InternalLayer>;
};

export type SchemaThunkAction<R, A extends AnyAction = AnyAction> = ThunkAction<
  R,
  SchemaState,
  any,
  A
>; // TODO - any are services

export const enum SchemaActions {
  analysisStarted = 'schema-service/schema/analysisStarted',
  analysisFinished = 'schema-service/schema/analysisFinished',
  analysisFailed = 'schema-service/schema/analysisFailed',
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

function resultId(): number {
  return Math.floor(Math.random() * 2 ** 53);
}

export const handleSchemaShare = (): SchemaThunkAction<void> => {
  return (dispatch, getState) => {
    const { schema, ns } = getState();
    void navigator.clipboard.writeText(JSON.stringify(schema, null, '  '));
    const hasSchema = schema !== null;
    dispatch(_trackSchemaShared(hasSchema));
    openToast(
      'share-schema',
      hasSchema
        ? {
            variant: 'success',
            title: 'Schema Copied',
            description: `The schema definition of ${ns} has been copied to your clipboard in JSON format.`,
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
): SchemaThunkAction<undefined> => {
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
  ns: undefined, // TODO: where is NS coming from
  geoLayers: {},
});

// // TODO: what to do with layers??
// onSchemaSampled (this: SchemaStore) {
// 	this.geoLayers = {};
// }

// geoLayerAdded(
// 	this: SchemaStore,
// 	field: string,
// 	layer: Layer,
// 	// NB: reflux doesn't return values from actions so we have to pass
// 	// component onChage as a callback
// 	onAdded: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
// ) {
// 	this.geoLayers = addLayer(
// 		field,
// 		layer as Circle | Polygon,
// 		this.geoLayers
// 	);
// 	onAdded(generateGeoQuery(this.geoLayers));
// },

// geoLayersEdited(
// 	this: SchemaStore,
// 	field: string,
// 	layers: LayerGroup,
// 	// NB: reflux doesn't return values from actions so we have to pass
// 	// component onChage as a callback
// 	onEdited: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
// ) {
// 	layers.eachLayer((layer) => {
// 		this.geoLayerAdded(field, layer, () => {
// 			// noop, we will call `onEdited` when we're done with updates
// 		});
// 	});
// 	onEdited(generateGeoQuery(this.geoLayers));
// },

// geoLayersDeleted(
// 	this: SchemaStore,
// 	layers: LayerGroup,
// 	// NB: reflux doesn't return values from actions so we have to pass
// 	// component onChage as a callback
// 	onDeleted: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
// ) {
// 	layers.eachLayer((layer) => {
// 		delete this.geoLayers[(layer as any)._leaflet_id];
// 	});
// 	onDeleted(generateGeoQuery(this.geoLayers));
// },

// stopAnalysis(this: SchemaStore) {
// 	this.state.abortController?.abort();
// },

export const _trackSchemaAnalyzed = (
  analysisTimeMS: number,
  query: Query
): SchemaThunkAction<undefined> => {
  return (dispatch, getState, { track, connectionInfoRef }) => {
    const { schema } = getState();
    // Use a function here to a) ensure that the calculations here
    // are only made when telemetry is enabled and b) that errors from
    // those calculations are caught and logged rather than displayed to
    // users as errors from the core schema analysis logic.
    const trackEvent = () => ({
      with_filter: Object.entries(query.filter ?? {}).length > 0,
      schema_width: schema?.fields?.length ?? 0,
      schema_depth: schema ? calculateSchemaDepth(schema) : 0,
      geo_data: schema ? schemaContainsGeoData(schema) : false,
      analysis_time_ms: analysisTimeMS,
    });
    track('Schema Analyzed', trackEvent, connectionInfoRef.current);
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
      debug,
      dataService,
      logger,
      fieldStoreService,
      log,
    }
  ) => {
    const query = queryBar.getLastAppliedQuery('schema');
    const { ns } = getState();

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

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      dispatch({ type: SchemaActions.analysisStarted });

      abortSignal?.addEventListener('abort', () => {
        dispatch(stopAnalysis(abortSignal.reason));
      });

      const analysisStartTime = Date.now();
      const schema = await analyzeSchema(
        dataService,
        abortSignal,
        ns,
        samplingOptions,
        driverOptions,
        logger
      );
      const analysisTime = Date.now() - analysisStartTime;

      if (schema !== null) {
        fieldStoreService.updateFieldsFromSchema(ns, schema);
      }

      dispatch({ type: SchemaActions.analysisFinished, schema });

      _trackSchemaAnalyzed(analysisTime, query);

      // this.onSchemaSampled(); // TODO: geoLayers
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
      // this.setState({ abortController: undefined }); // TODO: Abort controller
    }
  };
};

export default reducer;
