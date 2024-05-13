import Reflux from 'reflux';
// @ts-expect-error no types available
import StateMixin from 'reflux-state-mixin';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';
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
import type { DataService as OriginalDataService } from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type AppRegistry from 'hadron-app-registry';
import { configureActions } from '../actions';
import type { Circle, Layer, LayerGroup, Polygon } from 'leaflet';
import type { Schema } from 'mongodb-schema';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';

const DEFAULT_MAX_TIME_MS = 60000;
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
  localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  loggerAndTelemetry: LoggerAndTelemetry;
  preferences: PreferencesAccess;
  fieldStoreService: FieldStoreService;
};

type SchemaState = {
  localAppRegistry: SchemaPluginServices['localAppRegistry'];
  globalAppRegistry: SchemaPluginServices['globalAppRegistry'];
  analysisState: AnalysisState;
  errorMessage: string;
  schema: Schema | null;
  outdated: boolean;
  isActiveTab: boolean;
  resultId: number;
  abortController: undefined | AbortController;
};

type QueryState = {
  filter: Record<string, unknown>;
  limit: number;
  maxTimeMS: number;
  project: null | Record<string, unknown>;
};

export type SchemaStore = Reflux.Store & {
  state: Readonly<SchemaState>;
  setState(state: Partial<SchemaState>): void;

  localAppRegistry: SchemaPluginServices['localAppRegistry'];
  globalAppRegistry: SchemaPluginServices['globalAppRegistry'];
  fieldStoreService: SchemaPluginServices['fieldStoreService'];
  // TODO(COMPASS-6847): We don't really need this state in store, but it's hard
  // to factor away while the store is reflux
  query: QueryState;
  ns: string;
  geoLayers: Record<string, InternalLayer>;
  dataService: DataService;

  handleSchemaShare(): void;
  onQueryChanged(state: QueryState): void;
  onSubTabChanged(name: string): void;
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
  _trackSchemaAnalyzed(analysisTimeMS: number): void;
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
    loggerAndTelemetry,
    preferences,
    fieldStoreService,
  }: SchemaPluginServices,
  { on, cleanup }: ActivateHelpers
) {
  const { track, debug, log, mongoLogId } = loggerAndTelemetry;
  const actions = configureActions();

  /**
   * The reflux store for the schema.
   */
  const store: SchemaStore = Reflux.createStore({
    mixins: [StateMixin.store],
    listenables: actions,

    /**
     * Initialize the document list store.
     */
    init: function (this: SchemaStore) {
      this.query = {
        filter: {},
        project: null,
        limit: DEFAULT_SAMPLE_SIZE,
        maxTimeMS: DEFAULT_MAX_TIME_MS,
      };
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

    /**
     * Initialize the schema store.
     *
     * @return {Object} initial schema state.
     */
    getInitialState(this: SchemaStore): SchemaState {
      return {
        localAppRegistry,
        globalAppRegistry,
        analysisState: ANALYSIS_STATE_INITIAL,
        errorMessage: '',
        schema: null,
        outdated: false,
        isActiveTab: false,
        resultId: resultId(),
        abortController: undefined,
      };
    },

    onQueryChanged(this: SchemaStore, state: QueryState) {
      this.query.filter = state.filter;
      this.query.limit = state.limit;
      this.query.project = state.project;
      this.query.maxTimeMS = state.maxTimeMS;

      if (
        this.state.analysisState === ANALYSIS_STATE_COMPLETE &&
        !this.state.isActiveTab
      ) {
        this.setState({
          outdated: true,
        });
      }
    },

    onSubTabChanged(this: SchemaStore, name: string) {
      this.setState({
        isActiveTab: name === 'Schema',
      });
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

    _trackSchemaAnalyzed(this: SchemaStore, analysisTimeMS: number) {
      const { schema } = this.state;
      // Use a function here to a) ensure that the calculations here
      // are only made when telemetry is enabled and b) that errors from
      // those calculations are caught and logged rather than displayed to
      // users as errors from the core schema analysis logic.
      const trackEvent = () => ({
        with_filter: Object.entries(this.query.filter).length > 0,
        schema_width: schema?.fields?.length ?? 0,
        schema_depth: schema ? calculateSchemaDepth(schema) : 0,
        geo_data: schema ? schemaContainsGeoData(schema) : false,
        analysis_time_ms: analysisTimeMS,
      });
      track('Schema Analyzed', trackEvent);
    },

    startAnalysis: async function (this: SchemaStore) {
      const query = this.query || {};

      const sampleSize = query.limit
        ? Math.min(DEFAULT_SAMPLE_SIZE, query.limit)
        : DEFAULT_SAMPLE_SIZE;

      const samplingOptions = {
        query: query.filter,
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
          outdated: false,
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
          loggerAndTelemetry
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

        this._trackSchemaAnalyzed(analysisTime);

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

  // TODO(COMPASS-7544): remove dependency on this event
  on(localAppRegistry, 'subtab-changed', (name) => {
    store.onSubTabChanged(name);
  });

  // TODO(COMPASS-7543): remove dependency on this event
  on(localAppRegistry, 'query-changed', (state) => {
    store.onQueryChanged(state);
  });

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
