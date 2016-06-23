var _ = require('lodash');
var Schema = require('mongodb-schema').Schema;
var wrapError = require('./wrap-error');
var FieldCollection = require('mongodb-schema').FieldCollection;
var SchemaStatusSubview = require('../statusbar/schema-subview');
var filterableMixin = require('ampersand-collection-filterable');
var debug = require('debug')('mongodb-compass:models:schema');
var metrics = require('mongodb-js-metrics')();
var app = require('ampersand-app');

/**
 * wrapping mongodb-schema's FieldCollection with a filterable mixin
 */
var FilterableFieldCollection = FieldCollection.extend(filterableMixin, {
  modelType: 'FilterableFieldCollection'
});

module.exports = Schema.extend({
  derived: {
    sample_size: {
      deps: ['count'],
      fn: function() {
        return this.count;
      }
    }
  },
  session: {
    // total number of documents counted under the given query
    samplingStream: 'object',
    analyzingStream: 'object',
    total: 'number',
    is_fetching: {
      type: 'boolean',
      default: false
    },
    lastOptions: 'object'
  },
  namespace: 'SampledSchema',
  collections: {
    fields: FilterableFieldCollection
  },
  initialize: function() {
    this.stopAnalyzing = this.stopAnalyzing.bind(this);
  },
  /**
   * Clear any data accumulated from sampling.
   */
  reset: function() {
    debug('resetting');
    this.count = 0;
    this.fields.reset();
  },
  /**
   * After you fetch an initial sample, next you'll want to drill-down to a
   * smaller slice or drill back up to look at a larger slice.
   *
   * @example
   * schema.fetch({});
   * schema.refine({a: 1});
   * schema.refine({a: 1, b: 1});
   * schema.refine({a: 2});
   * @param {Object} options - Passthrough options.
   */
  refine: function(options) {
    debug('refining %j', options);
    this.reset();
    this.fetch(options);
  },
  /**
   * Take another sample on top of what you currently have.
   *
   * @example
   * schema.fetch({size: 100});
   * // schema.documents.length is now 100
   * schema.more({size: 100});
   * // schema.documents.length is now 200
   * schema.more({size: 10});
   * // schema.documents.length is now 210
   * @param {Object} options - Passthrough options.
   */
  more: function(options) {
    debug('fetching more %j', options);
    this.fetch(options);
  },
  /**
   * Get a sample of documents for a collection from the server.
   * Really this should only be called directly from the `initialize` function
   *
   * @param {Object} [options] - See below.
   * @option {Number} [size=100] Number of documents the sample should contain.
   * @option {Object} [query={}]
   * @option {Object} [fields=null]
   */
  fetch: function(options) {
    this.is_fetching = true;
    options = _.defaults(options || this.lastOptions || {}, {
      size: 1000,
      query: {},
      fields: null
    });
    this.lastOptions = _.clone(options);

    if (app.isFeatureEnabled('treasureHunt')) {
      if (options.query === {persistence: 'unique'}) {
        metrics.track('Treasure Hunt', 'stage4', {
          achievement: 'deciphered the secret message.',
          time: new Date()
        });
      }
    }

    var model = this;
    wrapError(this, options);

    var success = options.success;
    options.success = function(resp) {
      if (success) {
        success(model, resp, options);
      }
    };

    var start = new Date();
    var timeAtFirstDoc;
    var erroredOnDocs = [];
    var sampleCount = 0;

    var schemaStatusSubview = new SchemaStatusSubview({schema: this});


    var onFail = function(err) {
      // hide statusbar animation, progressbar (top)
      app.statusbar.animation = false;
      app.statusbar.trickle(false);
      app.statusbar.progressbar = false;

      // show error box with buttons for current stage (sampling/analyzing)
      schemaStatusSubview.error = true;
      schemaStatusSubview.showButtons();

      // track error
      metrics.error(err);

      // call error callback
      process.nextTick(options.error.bind(null, err));

      // trigger error so schema view can dismiss status bar
      model.trigger('error');
    };


    var onEnd = function(err) {
      model.is_fetching = false;

      if (err) {
        return onFail(err);
      }
      app.statusbar.hide(true);

      // @note (imlucas): Any other metrics?  Feedback on `Schema *`?
      var totalTime = new Date() - start;
      var timeToFirstDoc = timeAtFirstDoc - start;

      metrics.track('Schema', 'sampled', {
        duration: totalTime,
        'query clauses count': _.keys(options.query).length,
        'total document count': model.total,
        'schema width': model.width,
        'schema depth': model.depth,
        'sample size': sampleCount,
        'errored document count': erroredOnDocs.length,
        'total sample time': timeToFirstDoc,
        'total analysis time': totalTime - timeToFirstDoc,
        'average analysis time per doc': (totalTime - timeToFirstDoc) / sampleCount
      });
      model.trigger('sync');
      options.success({});
    };

    model.trigger('request', {}, {}, options);

    app.statusbar.set({
      animation: true,
      progressbar: true,
      width: 100
    });
    app.statusbar.showSubview(schemaStatusSubview);
    app.statusbar.width = 1;
    app.statusbar.trickle(true);

    app.dataService.count(model.ns, options.query, options, function(err, count) {
      if (err) {
        return onFail(err);
      }
      model.total = count;
      if (model.total === 0) {
        model.is_fetching = false;
        return onEnd();
      }

      var status = 0;
      var numSamples = Math.min(options.size, count);
      var stepSize = Math.ceil(Math.max(1, numSamples / 10));

      model.samplingStream = app.dataService.sample(model.ns, options);
      // pass in true for native (fast) sampler, false for ampersand-sampler
      model.analyzingStream = model.stream(true);

      model.samplingStream
        .on('error', function(sampleErr) {
          model.samplingStream.destroy();
          model.analyzingStream.destroy();
          onFail(sampleErr);
        })
        .pipe(model.analyzingStream)
        .once('progress', function() {
          timeAtFirstDoc = new Date();
          status = app.statusbar.width;
          schemaStatusSubview.activeStep = 'analyzing';
          app.statusbar.trickle(false);
        })
        .on('progress', function() {
          sampleCount++;
          if (sampleCount % stepSize === 0) {
            var inc = (100 - status) * stepSize / numSamples;
            app.statusbar.width += inc;
          }
        })
        .on('error', function(analysisErr) {
          schemaStatusSubview.error = true;
          onFail(analysisErr);
        })
        .on('end', function() {
          if (sampleCount === numSamples) {
            return onEnd();
          }
        });
    });
  },
  reSampleWithLongerTimeout: function() {
    app.queryOptions.maxTimeMS = 60000;
    this.fetch();
  },
  stopAnalyzing: function() {
    if (this.is_fetching) {
      this.is_fetching = false;
      this.samplingStream.destroy();
      this.analyzingStream.destroy();
    }
    app.statusbar.hide(true);
    this.trigger('sync');
  },
  serialize: function() {
    var res = this.getAttributes({
      props: true,
      derived: true
    }, true);
    res = _.omit(res, ['name', 'sample_size']);
    res.fields = this.fields.serialize();
    return res;
  }
});
