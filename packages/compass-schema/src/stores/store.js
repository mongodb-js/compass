import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import toNS from 'mongodb-ns';
import {
  createLoggerAndTelemetry,
  mongoLogId,
} from '@mongodb-js/compass-logging';
import { addLayer, generateGeoQuery } from '../modules/geo';
import {
  analyzeSchema,
  calculateSchemaDepth,
  schemaContainsGeoData,
} from '../modules/schema-analysis';
import {
  ANALYSIS_STATE_ANALYZING,
  ANALYSIS_STATE_COMPLETE,
  ANALYSIS_STATE_ERROR,
  ANALYSIS_STATE_INITIAL,
  ANALYSIS_STATE_TIMEOUT,
} from '../constants/analysis-states';
import { TAB_NAME } from '../constants/plugin';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';
import { openToast } from '@mongodb-js/compass-components';

const { track, debug, log } = createLoggerAndTelemetry('COMPASS-SCHEMA-UI');

const DEFAULT_MAX_TIME_MS = 60000;
const DEFAULT_SAMPLE_SIZE = 1000;

const ERROR_CODE_MAX_TIME_MS_EXPIRED = 50;

function getErrorState(err) {
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

/**
 * Set the data provider.
 *
 * @param {Store} store - The store.
 * @param {Error} error - The error (if any) while connecting.
 * @param {Object} provider - The data provider.
 */
export const setDataProvider = (store, error, provider) => {
  if (!error) {
    store.dataService = provider;
  }
};

/**
 * Set the namespace in the store.
 *
 * @param {Store} store - The store.
 * @param {String} ns - The namespace in "db.collection" format.
 */
export const setNamespace = (store, ns) => {
  const namespace = toNS(ns);
  if (namespace.collection) {
    store.ns = ns;
  }
};

/**
 * Set the global app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setGlobalAppRegistry = (store, appRegistry) => {
  store.globalAppRegistry = appRegistry;
};

/**
 * Set the local app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setLocalAppRegistry = (store, appRegistry) => {
  store.localAppRegistry = appRegistry;
};

function resultId() {
  return Math.floor(Math.random() * 2 ** 53);
}

/**
 * Configure a store with the provided options.
 *
 * @param {Object} options - The options.
 *
 * @returns {Store} The reflux store.
 */
const configureStore = (options = {}) => {
  /**
   * The reflux store for the schema.
   */
  const store = Reflux.createStore({
    mixins: [StateMixin.store],
    listenables: options.actions,

    /**
     * Initialize the document list store.
     */
    init: function () {
      this.query = {
        filter: {},
        project: null,
        limit: DEFAULT_SAMPLE_SIZE,
        maxTimeMS: DEFAULT_MAX_TIME_MS,
      };
      this.ns = '';
      this.geoLayers = {};
    },

    handleSchemaShare() {
      navigator.clipboard.writeText(
        JSON.stringify(this.state.schema, null, '  ')
      );
      const hasSchema = this.state.schema !== null;
      openToast('share-schema', {
        variant: hasSchema ? 'success' : 'warning',
        description: hasSchema
          ? `The schema definition of ${this.ns} has been copied to your clipboard in JSON format.`
          : 'Please Analyze the Schema First from the Schema Tab.',
        timeout: 5_000,
      });
    },

    /**
     * Initialize the schema store.
     *
     * @return {Object} initial schema state.
     */
    getInitialState() {
      return {
        localAppRegistry: null,
        globalAppRegistry: null,
        analysisState: ANALYSIS_STATE_INITIAL,
        errorMessage: '',
        schema: null,
        outdated: false,
        isActiveTab: false,
        resultId: resultId(),
        abortController: undefined,
      };
    },

    onQueryChanged(state) {
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

    onSubTabChanged(name) {
      this.setState({
        isActiveTab: name === TAB_NAME,
      });
    },

    onExportToLanguage(queryState) {
      this.localAppRegistry.emit(
        'open-query-export-to-language',
        {
          filter: queryState.filterString,
          project: queryState.projectString,
          sort: queryState.sortString,
          collation: queryState.collationString,
          skip: queryState.skipString,
          limit: queryState.limitString,
          maxTimeMS: queryState.maxTimeMSString,
        },
        'Query'
      );
    },

    onSchemaSampled() {
      this.geoLayers = {};
    },

    geoLayerAdded(field, layer) {
      this.geoLayers = addLayer(field, layer, this.geoLayers);
      this.localAppRegistry.emit('query-bar-change-filter', {
        type: 'mergeGeoQuery',
        payload: generateGeoQuery(this.geoLayers),
      });
    },

    geoLayersEdited(field, layers) {
      layers.eachLayer((layer) => {
        this.geoLayerAdded(field, layer);
      });
    },

    geoLayersDeleted(layers) {
      layers.eachLayer((layer) => {
        delete this.geoLayers[layer._leaflet_id];
      });
      this.localAppRegistry.emit('query-bar-change-filter', {
        type: 'mergeGeoQuery',
        payload: generateGeoQuery(this.geoLayers),
      });
    },

    async stopAnalysis() {
      this.state.abortController?.abort();
    },

    _trackSchemaAnalyzed(analysisTime) {
      const { schema } = this.state;
      // Use a function here to a) ensure that the calculations here
      // are only made when telemetry is enabled and b) that errors from
      // those calculations are caught and logged rather than displayed to
      // users as errors from the core schema analysis logic.
      const trackEvent = () => ({
        with_filter: Object.entries(this.query.filter).length > 0,
        schema_width: schema ? schema.fields.length : 0,
        schema_depth: schema ? calculateSchemaDepth(schema) : 0,
        geo_data: schema ? schemaContainsGeoData(schema) : false,
        analysis_time_ms: analysisTime,
      });
      track('Schema Analyzed', trackEvent);
    },

    startAnalysis: async function () {
      const query = this.query || {};

      const sampleSize = query.limit
        ? Math.min(DEFAULT_SAMPLE_SIZE, query.limit)
        : DEFAULT_SAMPLE_SIZE;

      const samplingOptions = {
        query: query.filter,
        size: sampleSize,
        fields: query.project,
      };

      const driverOptions = {
        maxTimeMS: capMaxTimeMSAtPreferenceLimit(query.maxTimeMS),
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
          driverOptions
        );
        const analysisTime = Date.now() - analysisStartTime;

        this.setState({
          analysisState: schema
            ? ANALYSIS_STATE_COMPLETE
            : ANALYSIS_STATE_INITIAL,
          schema: schema,
          resultId: resultId(),
        });

        this._trackSchemaAnalyzed(analysisTime);

        this.onSchemaSampled();
      } catch (err) {
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

    storeDidUpdate(prevState) {
      debug('schema store changed from', prevState, 'to', this.state);
    },
  });

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    options.localAppRegistry.on('subtab-changed', (name) => {
      store.onSubTabChanged(name);
    });

    /**
     * When the collection is changed, update the store.
     */
    options.localAppRegistry.on('query-changed', (state) => {
      store.onQueryChanged(state);
    });

    /**
     * When `Share Schema as JSON` clicked in menu show a dialog message.
     */
    options.localAppRegistry.on(
      'menu-share-schema-json',
      store.handleSchemaShare
    );

    setLocalAppRegistry(store, options.localAppRegistry);
  }

  // Set global app registry to get status actions.
  if (options.globalAppRegistry) {
    setGlobalAppRegistry(store, options.globalAppRegistry);
  }

  // Set the data provider - this must happen second.
  if (options.dataProvider) {
    setDataProvider(
      store,
      options.dataProvider.error,
      options.dataProvider.dataProvider
    );
  }

  // Set the namespace - must happen third.
  if (options.namespace) {
    setNamespace(store, options.namespace);
  }

  return store;
};

export default configureStore;
