const app = require('ampersand-app');
const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const Schema = require('mongodb-schema').Schema;
const _ = require('lodash');

// stores
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

// actions
const SchemaAction = require('../action');

const debug = require('debug')('mongodb-compass:stores:schema');
// const metrics = require('mongodb-js-metrics')();

const DEFAULT_MAX_TIME_MS = 10000;
const DEFAULT_NUM_DOCUMENTS = 1000;

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
    NamespaceStore.listen(() => {
      this._reset();
      SchemaAction.startSampling();
    });

    this.samplingStream = null;
    this.analyzingStream = null;
    this.samplingTimer = null;
    this.trickleStop = null;
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
  },

  /**
   * This function is called when the collection filter changes.
   */
  startSampling() {
    const QueryStore = app.appRegistry.getStore('QueryStore');
    const query = QueryStore.state.query;

    if (_.includes(['counting', 'sampling', 'analyzing'], this.state.samplingState)) {
      return;
    }

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

    const options = {
      maxTimeMS: this.state.maxTimeMS,
      query: query,
      size: DEFAULT_NUM_DOCUMENTS,
      fields: null
    };

    const samplingStart = new Date();
    this.samplingTimer = setInterval(() => {
      this.setState({
        samplingTimeMS: new Date() - samplingStart
      });
    }, 1000);

    this.samplingStream = app.dataService.sample(ns, options);
    const schema = new Schema();
    this.analyzingStream = schema.stream(true);

    const onError = () => {
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

    app.dataService.count(ns, query, {maxTimeMS: this.state.maxTimeMS}, (err, count) => {
      if (err) {
        return onError(err);
      }

      this.setState({
        samplingState: 'sampling',
        samplingProgress: 0,
        samplingTimeMS: new Date() - samplingStart
      });
      const numSamples = Math.min(count, DEFAULT_NUM_DOCUMENTS);
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
        .on('error', (analysisErr) => {
          onError(analysisErr);
        })
        .on('end', () => {
          if ((numSamples === 0 || sampleCount > 0) && this.state.samplingState !== 'error') {
            onSuccess(schema.serialize());
          } else {
            return onError();
          }
        });
    });
  },

  storeDidUpdate(prevState) {
    debug('schema store changed from %j to %j', prevState, this.state);
  }

});

module.exports = SchemaStore;
