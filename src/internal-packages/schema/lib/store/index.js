const app = require('hadron-app');
const ipc = require('hadron-ipc');
const { remote } = require('electron');
const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const schemaStream = require('mongodb-schema').stream;
const toNS = require('mongodb-ns');
const ReadPreference = require('mongodb').ReadPreference;

const COMPASS_ICON_PATH = require('../../../../icon').path;

/**
 * The default read preference.
 */
const READ = ReadPreference.PRIMARY_PREFERRED;

// stores
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

// actions
const SchemaAction = require('../action');

const debug = require('debug')('mongodb-compass:stores:schema');
// const metrics = require('mongodb-js-metrics')();

const DEFAULT_MAX_TIME_MS = 10000;
const MAX_NUM_DOCUMENTS = 1000;
const PROMOTE_VALUES = false;
const DEFAULT_QUERY = {
  filter: {},
  // project: null,
  limit: 1000
};

/**
 * The reflux store for the schema.
 */
const SchemaStore = Reflux.createStore({

  mixins: [StateMixin.store],
  listenables: SchemaAction,

  /**
   * Initialize the document list store.
   */
  init: function() {
    // if namespace and query both trigger, only listen to namespace change
    this.isNamespaceChanged = false;
    this.query = DEFAULT_QUERY;
    // listen for namespace changes
    NamespaceStore.listen((ns) => {
      if (ns && toNS(ns).collection) {
        this._reset();
        SchemaAction.startSampling();
      }
    });

    // listen for query changes
    this.listenToExternalStore('Query.ChangedStore', this.onQueryChanged.bind(this));

    this.samplingStream = null;
    this.analyzingStream = null;
    this.samplingTimer = null;
    this.trickleStop = null;

    ipc.on('window:menu-share-schema-json', this.handleSchemaShare.bind(this));
  },

  handleSchemaShare() {
    const dialog = remote.dialog;
    const BrowserWindow = remote.BrowserWindow;
    const clipboard = remote.clipboard;

    clipboard.writeText(JSON.stringify(this.state.schema, null, '  '));

    const detail = `The schema definition of ${NamespaceStore.ns} has been copied to your `
      + 'clipboard in JSON format.';

    dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
      type: 'info',
      icon: COMPASS_ICON_PATH,
      message: 'Share Schema',
      detail: detail,
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
      samplingState: 'initial',
      samplingProgress: 0,
      samplingTimeMS: 0,
      maxTimeMS: DEFAULT_MAX_TIME_MS,
      schema: null
    };
  },

  _reset: function() {
    this.setState(this.getInitialState());
  },

  onQueryChanged: function(state) {
    this._reset();
    this.query.filter = state.filter;
    this.query.limit = state.limit;
    SchemaAction.startSampling();
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
    if (!this.isNamespaceChanged) {
      return;
    }

    this.isNamespaceChanged = false;
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
  },

  /**
   * This function is called when the collection filter changes.
   */
  startSampling() {
    // we are not using state to guard against running this simultaneously
    if (this.isNamespaceChanged) {
      return;
    }

    this.isNamespaceChanged = true;

    const ns = NamespaceStore.ns;
    if (!ns) {
      return;
    }

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
      // project: this.query.project,
      promoteValues: PROMOTE_VALUES,
      readPreference: READ
    };
    debug('sampleOptions', sampleOptions);

    const samplingStart = new Date();
    this.samplingTimer = setInterval(() => {
      this.setState({
        samplingTimeMS: new Date() - samplingStart
      });
    }, 1000);


    this.samplingStream = app.dataService.sample(ns, sampleOptions);
    this.analyzingStream = schemaStream();
    let schema;

    const onError = (err) => {
      debug('onError', err);
      this.setState({
        samplingState: 'error'
      });
      this.stopSampling();
    };

    const onSuccess = (_schema) => {
      this.setState({
        samplingState: 'complete',
        samplingTimeMS: new Date() - samplingStart,
        samplingProgress: 100,
        schema: _schema
      });
      this.stopSampling();
    };

    const countOptions = {
      maxTimeMS: this.state.maxTimeMS,
      readPreference: READ
    };

    app.dataService.count(ns, this.query.filter, countOptions, (err, count) => {
      if (err) {
        return onError(err);
      }

      this.setState({
        samplingState: 'sampling',
        samplingProgress: 0,
        samplingTimeMS: new Date() - samplingStart
      });
      const numSamples = Math.min(count, sampleOptions.size);
      let sampleCount = 0;

      this.samplingStream
        .on('error', (sampleErr) => {
          return onError(sampleErr);
        })
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
          if (newProgress > this.state.samplingProgress) {
            this.setState({
              samplingProgress: Math.ceil(sampleCount / numSamples * 100),
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
          } else {
            return onError();
          }
        });
    });
  },

  storeDidUpdate(prevState) {
    debug('schema store changed from', prevState, 'to', this.state);
  }

});

module.exports = SchemaStore;
