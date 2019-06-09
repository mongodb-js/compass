import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { stream as schemaStream } from 'mongodb-schema';
import StatusSubview from 'components/status-subview';
import toNS from 'mongodb-ns';
import get from 'lodash.get';
import has from 'lodash.has';

const debug = require('debug')('mongodb-compass:stores:schema');

const COMPASS_ICON_PATH = ''; // require('../../../../icon').path;
const DEFAULT_MAX_TIME_MS = 10000;
const MAX_NUM_DOCUMENTS = 1000;
const PROMOTE_VALUES = false;
const DEFAULT_QUERY = {
  filter: {},
  project: null,
  limit: 1000
};

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
      this.query = DEFAULT_QUERY;
      this.ns = '';

      this.samplingStream = null;
      this.analyzingStream = null;
      this.samplingTimer = null;
      this.trickleStop = null;

      this.samplingLock = false;

      const ipc = require('hadron-ipc');
      ipc.on('window:menu-share-schema-json', this.handleSchemaShare.bind(this));
    },

    getShareText() {
      if (this.state.schema !== null) {
        return `The schema definition of ${this.ns} has been copied to your clipboard in JSON format.`;
      }
      return 'Please Analyze the Schema First from the Schema Tab.';
    },

    handleSchemaShare() {
      const { remote } = require('electron');
      const dialog = remote.dialog;
      const BrowserWindow = remote.BrowserWindow;
      const clipboard = remote.clipboard;

      clipboard.writeText(JSON.stringify(this.state.schema, null, '  '));

      dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        type: 'info',
        icon: COMPASS_ICON_PATH,
        message: 'Share Schema',
        detail: this.getShareText(),
        buttons: ['OK']
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
        samplingState: 'initial',
        samplingProgress: 0,
        samplingTimeMS: 0,
        errorMessage: '',
        maxTimeMS: DEFAULT_MAX_TIME_MS,
        schema: null,
        count: 0
      };
    },

    onQueryChanged: function(state) {
      this.query.filter = state.filter;
      this.query.limit = state.limit;
      this.query.project = state.project;
      if (this.state.samplingState === 'complete') {
        this.setState({
          samplingState: 'outdated'
        });
      }
    },

    setMaxTimeMS(maxTimeMS) {
      this.setState({
        maxTimeMS: maxTimeMS
      });
    },

    resetMaxTimeMS() {
      this.setState({
        maxTimeMS: DEFAULT_MAX_TIME_MS
      });
    },

    stopSampling() {
      if (this.samplingTimer) {
        clearInterval(this.samplingTimer);
        this.samplingTimer = null;
      }
      if (this.samplingStream) {
        this.samplingStream.destroy();
        this.samplingStream = null;
      }
      if (this.analyzingStream) {
        this.analyzingStream.destroy();
        this.analyzingStream = null;
      }
      if (this.samplingLock) {
        this.samplingLock = false;
      }
    },

    /**
     * This function is called when the collection filter changes.
     */
    startSampling() {
      if (this.samplingLock) {
        return;
      }

      this.samplingLock = true;

      this.setState({
        samplingState: 'counting',
        samplingProgress: -1,
        samplingTimeMS: 0,
        schema: null
      });

      const sampleOptions = {
        maxTimeMS: this.state.maxTimeMS,
        query: this.query.filter,
        size: this.query.limit === 0 ? 1000 : Math.min(MAX_NUM_DOCUMENTS, this.query.limit),
        fields: this.query.project,
        promoteValues: PROMOTE_VALUES
      };
      debug('sampleOptions', sampleOptions);

      const samplingStart = new Date();
      this.samplingTimer = setInterval(() => {
        this.setState({
          samplingTimeMS: new Date() - samplingStart
        });
      }, 1000);

      // reset the progress bar to 0
      this.globalAppRegistry.emit('compass:status:configure', {
        progress: 0,
        globalAppRegistry: this.globalAppRegistry,
        subview: StatusSubview,
        subviewStore: this,
        subviewActions: options.actions
      });

      this.samplingStream = this.dataService.sample(this.ns, sampleOptions);
      this.analyzingStream = schemaStream();
      let schema;

      const onError = (err) => {
        debug('onError', err);
        const errorState = (has(err, 'message') &&
          err.message.match(/operation exceeded time limit/)) ? 'timeout' : 'error';
        this.setState({
          samplingState: errorState,
          errorMessage: get(err, 'message') || 'unknown error'
        });
        this.globalAppRegistry.emit('compass:status:hide');
        this.stopSampling();
      };

      // @note: Durran the sampling strem itself is executing a count that gets
      //   the same error as the direct count call when a timeout has occured.
      //   However, we need to ensure we handle it in case we return from the
      //   other count before setting up the listener, so we listen for error
      //   here.
      this.samplingStream.on('error', (sampleErr) => {
        return onError(sampleErr);
      });

      const onSuccess = (_schema) => {
        this.setState({
          samplingState: 'complete',
          samplingTimeMS: new Date() - samplingStart,
          samplingProgress: 100,
          schema: _schema,
          errorMessage: ''
        });
        this.stopSampling();
      };

      const countOptions = {
        maxTimeMS: this.state.maxTimeMS
      };

      this.dataService.count(this.ns, this.query.filter, countOptions, (err, count) => {
        if (err) {
          return onError(err);
        }

        this.setState({
          count: count,
          samplingState: 'sampling',
          samplingProgress: 0,
          samplingTimeMS: new Date() - samplingStart
        });
        const numSamples = Math.min(count, sampleOptions.size);
        let sampleCount = 0;

        this.samplingStream
          .pipe(this.analyzingStream)
          .once('progress', () => {
            this.setState({
              samplingState: 'analyzing',
              samplingTimeMS: new Date() - samplingStart
            });
          })
          .on('progress', () => {
            sampleCount ++;
            const newProgress = Math.ceil(sampleCount / numSamples * 100);
            this.updateStatus(newProgress);
            if (newProgress > this.state.samplingProgress) {
              this.setState({
                samplingProgress: newProgress,
                samplingTimeMS: new Date() - samplingStart
              });
            }
          })
          .on('data', (data) => {
            schema = data;
          })
          .on('error', (analysisErr) => {
            onError(analysisErr);
          })
          .on('end', () => {
            if ((numSamples === 0 || sampleCount > 0) && this.state.samplingState !== 'error') {
              onSuccess(schema);
            }
            this.stopSampling();
          });
      });
    },

    updateStatus(progress) {
      if (progress === -1) {
        this.trickleStop = null;
        this.globalAppRegistry.emit('compass:status:configure', {
          visible: true,
          progressbar: true,
          animation: true,
          trickle: true,
          subview: StatusSubview,
          subviewStore: this,
          subviewActions: options.actions
        });
      } else if (progress >= 0 && progress < 100 && progress % 5 === 1) {
        if (this.trickleStop === null) {
          // remember where trickling stopped to calculate remaining progress
          this.trickleStop = progress;
        }
        const newProgress = Math.ceil(this.trickleStop + (100 - this.trickleStop) / 100 * progress);
        this.globalAppRegistry.emit('compass:status:configure', {
          visible: true,
          trickle: false,
          animation: true,
          progressbar: true,
          subview: StatusSubview,
          progress: newProgress,
          subviewStore: this,
          subviewActions: options.actions
        });
      } else if (progress === 100) {
        this.globalAppRegistry.emit('compass:status:done');
      }
    },

    storeDidUpdate(prevState) {
      debug('schema store changed from', prevState, 'to', this.state);
    }
  });

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    /**
     * When the collection is changed, update the store.
     */
    options.localAppRegistry.on('query-changed', (state) => {
      store.onQueryChanged(state);
    });

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
