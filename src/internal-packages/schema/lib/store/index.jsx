const app = require('ampersand-app');
const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const schemaStream = require('mongodb-schema').stream;
const toNS = require('mongodb-ns');

const _ = require('lodash');
const ReadPreference = require('mongodb').ReadPreference;
const bson = require('bson');

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
const DEFAULT_NUM_DOCUMENTS = 1000;

const miss = require('mississippi');
const createMergeStream = require('merge-stream');
/**
 * Helper for @anna that will always include some documents in the
 * sample.
 * @param {String} ns - ${database}.${collection}
 * @param {Object} query
 * @param {Object} [options]
 * @return {stream.Readable}
 */
const withResults = (ns, query, options) => {
  const opts = _.defaults(options || {}, {
    readPreference: ReadPreference.PRIMARY_PREFERRED
  });

  let executed = false;
  return miss.from.obj((size, next) => {
    if (executed) {
      return;
    }
    executed = true;

    app.dataService.find(ns, query, opts, (err, docs) => {
      if (err) {
        return next(err);
      }

      docs.forEach( (doc) => next(null, doc));
      next(null, null);
    });
  });
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
    NamespaceStore.listen((ns) => {
      if (ns && toNS(ns).collection) {
        this._reset();
        SchemaAction.startSampling();
      }
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
      if (this.samplingStream.destroy) {
        this.samplingStream.destroy();
      }
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
    const QueryStore = app.appRegistry.getStore('Query.Store');
    const query = QueryStore.state.query;
    let timeout = 0;
    if (QueryStore.getQueryNum() === 2) {
      timeout = 20000;
    }
    QueryStore.setQueryNum();

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
      fields: null,
      readPreference: READ
    };

    const samplingStart = new Date();
    this.samplingTimer = setInterval(() => {
      this.setState({
        samplingTimeMS: new Date() - samplingStart
      });
    }, 1000);

    const self = this;
    setTimeout(function() {
      self.samplingStream = createMergeStream(
        app.dataService.sample(ns, options),
        withResults('londonbikes.rides_pickup', {'_id': bson.ObjectId('5810ef6602792428c505ad80')})
      );
      self.analyzingStream = schemaStream();
      let schema;

      const onError = () => {
        self.setState({
          samplingState: 'error'
        });
        self.stopSampling();
      };

      const onSuccess = (_schema) => {
        self.setState({
          samplingState: 'complete',
          samplingTimeMS: new Date() - samplingStart,
          samplingProgress: 100,
          schema: _schema
        });
        self.stopSampling();
      };

      const countOptions = { maxTimeMS: self.state.maxTimeMS, readPreference: READ };
      app.dataService.count(ns, query, countOptions, (err, count) => {
        if (err) {
          return onError(err);
        }

        self.setState({
          samplingState: 'sampling',
          samplingProgress: 0,
          samplingTimeMS: new Date() - samplingStart
        });
        const numSamples = Math.min(count, DEFAULT_NUM_DOCUMENTS);
        let sampleCount = 0;

        self.samplingStream
          .on('error', (sampleErr) => {
            return onError(sampleErr);
          })
          .pipe(self.analyzingStream)
          .once('progress', () => {
            self.setState({
              samplingState: 'analyzing',
              samplingTimeMS: new Date() - samplingStart
            });
          })
          .on('progress', () => {
            sampleCount ++;
            const newProgress = Math.ceil(sampleCount / numSamples * 100);
            if (newProgress > self.state.samplingProgress) {
              self.setState({
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
            if ((numSamples === 0 || sampleCount > 0) && self.state.samplingState !== 'error') {
              onSuccess(schema);
            } else {
              return onError();
            }
          });
      });
    }, timeout);
  },

  storeDidUpdate(prevState) {
    // debug('schema store changed from', prevState, 'to', this.state);
  }

});

module.exports = SchemaStore;
