import Reflux from 'reflux';
import type { StoreWithStateMixin } from '@mongodb-js/reflux-state-mixin';
import StateMixin from '@mongodb-js/reflux-state-mixin';
import type { Logger } from '@mongodb-js/compass-logging';
import type { InternalLayer } from '../modules/geo';
import { addLayer, generateGeoQuery } from '../modules/geo';
import {
  analyzeSchema,
  calculateSchemaDepth,
  schemaContainsGeoData,
} from '../modules/schema-analysis';
import type { AnalysisState } from '../constants/analysis-states';
import {
  ANALYSIS_STATE_ANALYZING,
  ANALYSIS_STATE_COMPLETE,
  ANALYSIS_STATE_ERROR,
  ANALYSIS_STATE_INITIAL,
  ANALYSIS_STATE_TIMEOUT,
} from '../constants/analysis-states';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import { openToast } from '@mongodb-js/compass-components';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type {
  ConnectionInfoRef,
  DataService as OriginalDataService,
} from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type AppRegistry from 'hadron-app-registry';
import { configureActions } from '../actions';
import type { Circle, Layer, LayerGroup, Polygon } from 'leaflet';
import type { Schema } from 'mongodb-schema';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';
import type { Query, QueryBarService } from '@mongodb-js/compass-query-bar';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';

const DEFAULT_SAMPLE_SIZE = 1000;

const ERROR_CODE_MAX_TIME_MS_EXPIRED = 50;

function getErrorState(err: Error & { code?: number }) {
  const errorMessage = (err && err.message) || 'Unknown error';
  const errorCode = err && err.code;

  let analysisState;

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

export type DataService = Pick<OriginalDataService, 'sample' | 'isCancelError'>;
export type SchemaPluginServices = {
  dataService: DataService;
  connectionInfoRef: ConnectionInfoRef;
  localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  logger: Logger;
  track: TrackFunction;
  preferences: PreferencesAccess;
  fieldStoreService: FieldStoreService;
  queryBar: QueryBarService;
};

type SchemaState = {
  analysisState: AnalysisState;
  errorMessage: string;
  schema: Schema | null;
  resultId: number;
  abortController: undefined | AbortController;
};

export type SchemaStore = StoreWithStateMixin<SchemaState> & {
  localAppRegistry: SchemaPluginServices['localAppRegistry'];
  globalAppRegistry: SchemaPluginServices['globalAppRegistry'];
  fieldStoreService: SchemaPluginServices['fieldStoreService'];
  ns: string;
  geoLayers: Record<string, InternalLayer>;
  dataService: DataService;

  handleSchemaShare(): void;
  _trackSchemaShared(hasSchema: boolean): void;

  onSchemaSampled(): void;
  geoLayerAdded(
    field: string,
    layer: Layer,
    // NB: reflux doesn't return values from actions so we have to pass
    // component onChage as a callback
    onAdded: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
  ): void;
  geoLayersEdited(
    field: string,
    layers: LayerGroup,
    // NB: reflux doesn't return values from actions so we have to pass
    // component onChage as a callback
    onEdited: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
  ): void;
  geoLayersDeleted(
    layers: LayerGroup,
    // NB: reflux doesn't return values from actions so we have to pass
    // component onChage as a callback
    onDeleted: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
  ): void;
  stopAnalysis(): void;
  _trackSchemaAnalyzed(analysisTimeMS: number, query: any): void;
  startAnalysis(): void;
};

/**
 * Configure a store with the provided options.
 *
 * @param {Object} options - The options.
 *
 * @returns {Store} The reflux store.
 */
export function activateSchemaPlugin(
  options: Pick<CollectionTabPluginMetadata, 'namespace'>,
  {
    dataService,
    localAppRegistry,
    globalAppRegistry,
    logger,
    track,
    preferences,
    fieldStoreService,
    queryBar,
    connectionInfoRef,
  }: SchemaPluginServices,
  { on, cleanup }: ActivateHelpers
) {
  const { debug, log, mongoLogId } = logger;
  const actions = configureActions();

  /**
   * The reflux store for the schema.
   */
  const store: SchemaStore = Reflux.createStore({
    mixins: [StateMixin.store<SchemaState>()],
    listenables: actions,

    /**
     * Initialize the document list store.
     */
    init: function (this: SchemaStore) {
      this.ns = options.namespace;
      this.geoLayers = {};
      this.dataService = dataService;
      this.localAppRegistry = localAppRegistry;
      this.globalAppRegistry = globalAppRegistry;
      this.fieldStoreService = fieldStoreService;
    },

    handleSchemaShare(this: SchemaStore) {
      void navigator.clipboard.writeText(
        JSON.stringify(this.state.schema, null, '  ')
      );
      const hasSchema = this.state.schema !== null;
      this._trackSchemaShared(hasSchema);
      openToast(
        'share-schema',
        hasSchema
          ? {
              variant: 'success',
              title: 'Schema Copied',
              description: `The schema definition of ${this.ns} has been copied to your clipboard in JSON format.`,
              timeout: 5_000,
            }
          : {
              variant: 'warning',
              title: 'Analyze Schema First',
              description:
                'Please Analyze the Schema First from the Schema Tab.',
              timeout: 5_000,
            }
      );
    },

    _trackSchemaShared(this: SchemaStore, hasSchema: boolean) {
      const { schema } = this.state;
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
    },

    /**
     * Initialize the schema store.
     *
     * @return {Object} initial schema state.
     */
    getInitialState(this: SchemaStore): SchemaState {
      return {
        analysisState: ANALYSIS_STATE_INITIAL,
        errorMessage: '',
        schema: null,
        resultId: resultId(),
        abortController: undefined,
      };
    },

    onSchemaSampled(this: SchemaStore) {
      this.geoLayers = {};
    },

    geoLayerAdded(
      this: SchemaStore,
      field: string,
      layer: Layer,
      // NB: reflux doesn't return values from actions so we have to pass
      // component onChage as a callback
      onAdded: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
    ) {
      this.geoLayers = addLayer(
        field,
        layer as Circle | Polygon,
        this.geoLayers
      );
      onAdded(generateGeoQuery(this.geoLayers));
    },

    geoLayersEdited(
      this: SchemaStore,
      field: string,
      layers: LayerGroup,
      // NB: reflux doesn't return values from actions so we have to pass
      // component onChage as a callback
      onEdited: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
    ) {
      layers.eachLayer((layer) => {
        this.geoLayerAdded(field, layer, () => {
          // noop, we will call `onEdited` when we're done with updates
        });
      });
      onEdited(generateGeoQuery(this.geoLayers));
    },

    geoLayersDeleted(
      this: SchemaStore,
      layers: LayerGroup,
      // NB: reflux doesn't return values from actions so we have to pass
      // component onChage as a callback
      onDeleted: (geoQuery: ReturnType<typeof generateGeoQuery>) => void
    ) {
      layers.eachLayer((layer) => {
        delete this.geoLayers[(layer as any)._leaflet_id];
      });
      onDeleted(generateGeoQuery(this.geoLayers));
    },

    stopAnalysis(this: SchemaStore) {
      this.state.abortController?.abort();
    },

    _trackSchemaAnalyzed(
      this: SchemaStore,
      analysisTimeMS: number,
      query: Query
    ) {
      const { schema } = this.state;
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
    },

    startAnalysis: async function (this: SchemaStore) {
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

        const abortController = new AbortController();
        const abortSignal = abortController.signal;

        this.setState({
          analysisState: ANALYSIS_STATE_ANALYZING,
          errorMessage: '',
          schema: null,
          abortController,
        });

        const analysisStartTime = Date.now();
        const schema = await analyzeSchema(
          this.dataService,
          abortSignal,
          this.ns,
          samplingOptions,
          driverOptions,
          logger
        );
        const analysisTime = Date.now() - analysisStartTime;

        if (schema !== null) {
          this.fieldStoreService.updateFieldsFromSchema(this.ns, schema);
        }

        this.setState({
          analysisState: schema
            ? ANALYSIS_STATE_COMPLETE
            : ANALYSIS_STATE_INITIAL,
          schema: schema,
          resultId: resultId(),
        });

        this._trackSchemaAnalyzed(analysisTime, query);

        this.onSchemaSampled();
      } catch (err: any) {
        log.error(
          mongoLogId(1_001_000_188),
          'Schema analysis',
          'Error sampling schema',
          {
            error: err.stack,
          }
        );
        this.setState({ ...getErrorState(err), resultId: resultId() });
      } finally {
        this.setState({ abortController: undefined });
      }
    },

    storeDidUpdate(this: SchemaStore, prevState: SchemaState) {
      debug('schema store changed from', prevState, 'to', this.state);
    },
  }) as SchemaStore;

  /**
   * When `Share Schema as JSON` clicked in menu show a dialog message.
   */
  on(localAppRegistry, 'menu-share-schema-json', () =>
    store.handleSchemaShare()
  );

  return {
    store,
    actions,
    deactivate() {
      cleanup();
    },
  };
}
