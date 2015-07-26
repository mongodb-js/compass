var _ = require('lodash');
var Schema = require('mongodb-schema').Schema;
var wrapError = require('./wrap-error');
var FieldCollection = require('mongodb-schema').FieldCollection;
var filterableMixin = require('ampersand-collection-filterable');
var SampledDocumentCollection = require('./sampled-document-collection');
var es = require('event-stream');
var debug = require('debug')('scout:models:schema');
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
  props: {
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
   * schema.fetch({limit: 100});
   * // schema.documents.length is now 100
   * schema.more({limit: 100});
   * // schema.documents.length is now 200
   * schema.more({limit: 10});
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

    var parse = function(doc, cb) {
      model.parse(doc);
      cb(null, doc);
    };

    var docs = [];

    var addToDocuments = function(doc, cb) {
      docs.push(doc);
      cb();
    };

    var onEnd = function(err) {
      model.is_fetching = false;
      if (err) return options.error(model, err);
      model.documents.reset(docs);
      model.documents.trigger('sync');
      options.success({});
    };

    var success = options.success;
    options.success = function(resp) {
      if (success) {
        success(model, resp, options);
      }
      model.trigger('sync');
    };

    model.trigger('request', {}, {}, options);

    debug('creating sample stream');
    app.client.sample(model.ns, options)
      .pipe(es.map(parse))
      .pipe(es.map(addToDocuments))
      .pipe(es.wait(onEnd));
  }
});
