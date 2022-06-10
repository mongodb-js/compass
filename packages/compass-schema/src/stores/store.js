import Reflux from 'reflux';
import ipc from 'hadron-ipc';
import StateMixin from 'reflux-state-mixin';
import toNS from 'mongodb-ns';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { intersection } from 'lodash';
import { addLayer, generateGeoQuery } from '../modules/geo';
import createSchemaAnalysis from '../modules/schema-analysis';
import {
  ANALYSIS_STATE_ANALYZING,
  ANALYSIS_STATE_COMPLETE,
  ANALYSIS_STATE_ERROR,
  ANALYSIS_STATE_INITIAL,
  ANALYSIS_STATE_TIMEOUT,
} from '../constants/analysis-states';
import { TAB_NAME } from '../constants/plugin';

const debug = require('debug')('mongodb-compass:stores:schema');
const { track } = createLoggerAndTelemetry('COMPASS-SCHEMA-UI');

const DEFAULT_MAX_TIME_MS = 60000;
const DEFAULT_SAMPLE_SIZE = 1000;

const ERROR_CODE_MAX_TIME_MS_EXPIRED = 50;

const MONGODB_GEO_TYPES = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection',
];

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

    getShareText() {
      if (this.state.schema !== null) {
        return `The schema definition of ${this.ns} has been copied to your clipboard in JSON format.`;
      }
      return 'Please Analyze the Schema First from the Schema Tab.';
    },

    handleSchemaShare() {
      const { remote } = require('electron');
      const clipboard = remote.clipboard;

      clipboard.writeText(JSON.stringify(this.state.schema, null, '  '));
      ipc.call('app:show-info-dialog', 'Share Schema', this.getShareText());
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
      this.localAppRegistry.emit('open-query-export-to-language', {
        filter: queryState.filterString,
        project: queryState.projectString,
        sort: queryState.sortString,
        collation: queryState.collationString,
        skip: queryState.skipString,
        limit: queryState.limitString,
        maxTimeMS: queryState.maxTimeMSString,
      });
      this.globalAppRegistry.emit('compass:export-to-language:opened', {
        source: 'Schema',
      });
    },

    onSchemaSampled() {
      this.geoLayers = {};

      process.nextTick(() => {
        this.globalAppRegistry.emit('compass:schema:schema-sampled', {
          ...this.state,
          geo: this.geoLayers,
        });
      });
    },

    geoLayerAdded(field, layer) {
      this.geoLayers = addLayer(field, layer, this.geoLayers);
      this.localAppRegistry.emit(
        'compass:schema:geo-query',
        generateGeoQuery(this.geoLayers)
      );
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
      this.localAppRegistry.emit(
        'compass:schema:geo-query',
        generateGeoQuery(this.geoLayers)
      );
    },

    async stopAnalysis() {
      if (!this.schemaAnalysis) {
        return;
      }

      try {
        await this.schemaAnalysis.terminate();
      } catch (err) {
        debug('failed to terminate schema analysis. ignoring ...', err);
      } finally {
        this.schemaAnalysis = null;
      }
    },

    _calculateDepthByPath(input, paths) {
      if (!input) {
        return paths;
      }
      input.forEach(({ types, fields, path, bsonType }) => {
        /*
         * Given the strucutre of schema, in case of an array,
         * the path to an array item is still the same because indexes are not
         * counted and for that reason we have an increment of 1 for arrays.
         */
        const increment = bsonType === 'Array' ? 1 : 0;
        const score = path.split('.').length + increment;
        if (!paths[path] || paths[path] < score) {
          paths[path] = score;
        }
        this._calculateDepthByPath(types ?? fields, paths);
      });

      return paths;
    },

    calculateSchemaDepth(schema) {
      const response = this._calculateDepthByPath(schema.fields, {});
      const values = Object.values(response);
      return Math.max(...values, 0);
    },

    _containsGeoData(input) {
      let result = false;
      if (!input) {
        return result;
      }
      for (const { path, values, types, fields } of input) {
        if (
          path.endsWith('.type') &&
          intersection(MONGODB_GEO_TYPES, values).length > 0
        ) {
          result = true;
        }
        if (!result) {
          result = this._containsGeoData(types ?? fields);
        }
      }
      return result;
    },

    schemaContainsGeoData(schema) {
      return this._containsGeoData(schema.fields);
    },

    _trackSchemaAnalyzed(analysisTime) {
      const { schema } = this.state;
      const trackEvent = {
        with_filter: Object.entries(this.query.filter).length > 0,
        schema_width: schema.fields.length,
        schema_depth: this.calculateSchemaDepth(schema),
        geo_data: this.schemaContainsGeoData(schema),
        analysis_time_ms: analysisTime,
      };
      track('Schema Analyzed', trackEvent);
    },

    startAnalysis: async function () {
      if (this.schemaAnalysis) {
        return;
      }

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
        maxTimeMS: query.maxTimeMS,
      };

      const schemaAnalysis = createSchemaAnalysis(
        this.dataService,
        this.ns,
        samplingOptions,
        driverOptions
      );

      this.schemaAnalysis = schemaAnalysis;

      try {
        debug('analysis started');

        this.setState({
          analysisState: ANALYSIS_STATE_ANALYZING,
          errorMessage: '',
          outdated: false,
          schema: null,
        });

        const analysisStartTime = Date.now();
        const schema = await schemaAnalysis.getResult();
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
        debug('analysis error catched', err);
        this.setState({ ...getErrorState(err), resultId: resultId() });
      } finally {
        this.schemaAnalysis = null;
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
