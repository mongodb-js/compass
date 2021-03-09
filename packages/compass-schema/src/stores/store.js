import Reflux from 'reflux';
import ipc from 'hadron-ipc';
import StateMixin from 'reflux-state-mixin';
import toNS from 'mongodb-ns';
import { addLayer, generateGeoQuery } from 'modules/geo';
import createSchemaAnalysis from '../modules/schema-analysis';
import {
  ANALYSIS_STATE_ANALYZING,
  ANALYSIS_STATE_COMPLETE,
  ANALYSIS_STATE_ERROR,
  ANALYSIS_STATE_INITIAL,
  ANALYSIS_STATE_TIMEOUT
} from '../constants/analysis-states';
import { TAB_NAME } from '../constants/plugin';

const debug = require('debug')('mongodb-compass:stores:schema');

const DEFAULT_MAX_TIME_MS = 60000;
const DEFAULT_SAMPLE_SIZE = 1000;

const ERROR_CODE_MAX_TIME_MS_EXPIRED = 50;

function getErrorState(err) {
  const errorMessage = (err && err.message) || 'Unknown error';
  const errorCode = (err && err.code);

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
    init: function() {
      this.query = {
        filter: {},
        project: null,
        limit: DEFAULT_SAMPLE_SIZE,
        maxTimeMS: DEFAULT_MAX_TIME_MS
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
        isActiveTab: false
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
          outdated: true
        });
      }
    },

    onSubTabChanged(name) {
      this.setState({
        isActiveTab: name === TAB_NAME
      });
    },

    onSchemaSampled() {
      this.geoLayers = {};

      process.nextTick(() => {
        this.globalAppRegistry.emit(
          'compass:schema:schema-sampled',
          { ...this.state, geo: this.geoLayers }
        );
      });
    },

    geoLayerAdded(field, layer) {
      this.geoLayers = addLayer(field, layer, this.geoLayers);
      this.localAppRegistry.emit('compass:schema:geo-query', generateGeoQuery(this.geoLayers));
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

    startAnalysis: async function() {
      if (this.schemaAnalysis) {
        return;
      }

      const query = this.query || {};

      const sampleSize = query.limit ?
        Math.min(DEFAULT_SAMPLE_SIZE, query.limit) :
        DEFAULT_SAMPLE_SIZE;

      const samplingOptions = {
        query: query.filter,
        size: sampleSize,
        fields: query.project
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
          schema: null
        });

        const schema = await schemaAnalysis.getResult();

        this.setState({
          analysisState: schema ?
            ANALYSIS_STATE_COMPLETE :
            ANALYSIS_STATE_INITIAL,
          schema: schema
        });

        this.onSchemaSampled();
      } catch (err) {
        debug('analysis error catched', err);
        this.setState(getErrorState(err));
      } finally {
        this.schemaAnalysis = null;
      }
    },

    storeDidUpdate(prevState) {
      debug('schema store changed from', prevState, 'to', this.state);
    }
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
    options.localAppRegistry.on('menu-share-schema-json', store.handleSchemaShare);

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
