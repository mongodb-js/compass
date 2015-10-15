var _ = require('lodash');
var Schema = require('mongodb-schema').Schema;
var wrapError = require('./wrap-error');
var FieldCollection = require('mongodb-schema').FieldCollection;
var filterableMixin = require('ampersand-collection-filterable');
var SampledDocumentCollection = require('./sampled-document-collection');
var es = require('event-stream');
var debug = require('debug')('scout:models:schema');
var debugMetrics = require('debug')('scout:metrics');
var app = require('ampersand-app');

// @todo: stub for metrics module. currently just logs debug messages with scout:metrics marker
var metrics = {
  track: function(label, err, obj) {
    if (!obj) {
      obj = err;
      err = null;
    }
    if (err) {
      debugMetrics(label, err, obj);
    } else {
      debugMetrics(label, obj);
    }
  }
};

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
    fields: FilterableFieldCollection,
    documents: SampledDocumentCollection
  },
  /**
   * Clear any data accumulated from sampling.
   */
  reset: function() {
    debug('resetting');
    this.count = 0;
    this.fields.reset();
    this.documents.reset();
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

    // No results found
    var onEmpty = function() {
      model.is_fetching = false;
      model.documents.reset();
      model.documents.trigger('sync');
      options.success({});
    };

    var docs = [];
    var addToDocuments = function(doc, cb) {
      docs.push(doc);
      cb();
    };

    var parse = function(doc, cb) {
      if (!timeAtFirstDoc) {
        timeAtFirstDoc = new Date();
      }
      try {
        model.parse(doc);
      } catch (err) {
        erroredOnDocs.push(doc);
        metrics.track('Schema: Error: Parse', err, {
          doc: doc,
          schema: model.serialize()
        });
      }
      cb(null, doc);
    };

    var onEnd = function(err) {
      model.is_fetching = false;
      if (err) {
        metrics.track('Schema: Error: End', err, {
          schema: model
        });
        return options.error(model, err);
      }
      model.documents.reset(docs);
      model.documents.trigger('sync');
      app.statusbar.hide();

      // @note (imlucas): Any other metrics?  Feedback on `Schema *`?
      var totalTime = new Date() - start;
      var timeToFirstDoc = timeAtFirstDoc - start;

      metrics.track('Schema: Complete', {
        duration: totalTime,
        'total document count': model.total,
        'sample size': model.documents.length,
        'errored document count': erroredOnDocs.length,
        'total sample time': timeToFirstDoc,
        'total analysis time': totalTime - timeToFirstDoc,
        'average analysis time per doc': (totalTime - timeToFirstDoc) / model.documents.length
        // 'Schema Height': model.height, // # of top level keys
        // 'Schema Width': model.width, // max nesting depth
        // 'Schema Sparsity': model.sparsity // lots of fields missing or consistent
      });
      options.success({});
    };

    model.trigger('request', {}, {}, options);

    app.client.count(model.ns, options, function(err, count) {
      if (err) {
        metrics.track('Schema: Error: Count', err, {
          schema: model
        });
        return options.error(model, err);
      }
      debug('options', options, 'count', count.count);
      model.total = count.count;
      if (model.total === 0) {
        return onEmpty();
      }

      debug('creating sample stream');
      var status = 0;
      var counter = 0;
      app.statusbar.show('Sampling collection...');
      app.statusbar.width = 1;
      app.statusbar.trickle(true);
      app.client.sample(model.ns, options)
        .pipe(es.map(parse))
        .once('data', function() {
          status = app.statusbar.width;
          app.statusbar.message = 'Analyzing documents...';
          app.statusbar.trickle(false);
        })
        .on('data', function() {
          counter ++;
          if (counter % 7 === 0) {
            var inc = (100 - status) * 7 / options.size;
            app.statusbar.width += inc;
          }
        })
        .pipe(es.map(addToDocuments))
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
