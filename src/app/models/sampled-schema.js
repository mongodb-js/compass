var _ = require('lodash');
var Schema = require('mongodb-schema').Schema;
var wrapError = require('./wrap-error');
var FieldCollection = require('mongodb-schema').FieldCollection;
var SchemaStatusSubview = require('../statusbar/schema-subview');
var filterableMixin = require('ampersand-collection-filterable');
var es = require('event-stream');
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
    total: 'number',
    is_fetching: {
      type: 'boolean',
      default: false
    }
  },
  namespace: 'SampledSchema',
  collections: {
    fields: FilterableFieldCollection
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
    options = _.defaults(options || {}, {
      size: 100,
      query: {},
      fields: null
    });

    var model = this;
    wrapError(this, options);

    var success = options.success;
    options.success = function(resp) {
      if (success) {
        success(model, resp, options);
      }
      model.trigger('sync');
    };
    var start = new Date();
    var timeAtFirstDoc;
    var erroredOnDocs = [];
    var sampleCount = 0;

    // No results found
    var onEmpty = function() {
      model.is_fetching = false;
      options.success({});
    };


    var onEnd = function(err) {
      debug('onEnd', err);
      model.is_fetching = false;
      if (err) {
        metrics.error(err);
        process.nextTick(options.error.bind(null, err));
        app.statusbar.hide(true);
        return;
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
      options.success({});
    };

    model.trigger('request', {}, {}, options);

    app.dataService.count(model.ns, options.query, options, function(err, count) {
      if (err) {
        metrics.error(err);
        return options.error(err);
      }
      model.total = count;
      if (model.total === 0) {
        return onEmpty();
      }

      var status = 0;
      var counter = 0;
      var numSamples = Math.min(options.size, count.count);
      var stepSize = Math.ceil(Math.max(1, numSamples / 10));

      var schemaStatusSubview = new SchemaStatusSubview();
      app.statusbar.show();
      app.statusbar.showSubview(schemaStatusSubview);
      app.statusbar.width = 1;
      app.statusbar.trickle(true);
      app.dataService.sample(model.ns, options)
      app.client.sample(model.ns, options)
        .on('error', function(sampleErr) {
          debug('error received', sampleErr);
          app.statusbar.animation = false;
          app.statusbar.trickle(false);
          app.statusbar.progressbar = false;
          return;
        })
        .on('data', function() {
          debug('on progress');
          sampleCount++;
          if (sampleCount % stepSize === 0) {
            var inc = (100 - status) * stepSize / numSamples;
            app.statusbar.width += inc;
          }
        })
        // .pipe(model.stream(true))
        // .once('progress', function() {
        //   debug('once progress');
        //   timeAtFirstDoc = new Date();
        //   status = app.statusbar.width;
        //   schemaStatusSubview.activeStep = 'analyzing';
        //   app.statusbar.trickle(false);
        // })
        // .on('progress', function() {
        //   debug('on progress');
        //   sampleCount++;
        //   if (sampleCount % stepSize === 0) {
        //     var inc = (100 - status) * stepSize / numSamples;
        //     app.statusbar.width += inc;
        //   }
        // })
        // .on('error', function(analysisErr) {
        //   debug('on error');
        //   onEnd(analysisErr);
        // })
        .pipe(es.wait(onEnd));
    });
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
