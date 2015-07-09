var _ = require('lodash');
var Schema = require('mongodb-schema').Schema;
var wrapError = require('./wrap-error');
var app = require('ampersand-app');
var FieldCollection = require('mongodb-schema').FieldCollection;
var filterableMixin = require('ampersand-collection-filterable');

/**
 * wrapping mongodb-schema's FieldCollection with a filterable mixin
 */
var FilterableFieldCollection = FieldCollection.extend(filterableMixin, {
  modelType: 'FilterableFieldCollection'
});

module.exports = Schema.extend({
  namespace: 'SampledSchema',
  /**
   * Our fields need to be filterable, adding a mixin
   */
  collections: {
    fields: FilterableFieldCollection
  },
  /**
   * Clear any data accumulated from sampling.
   */
  reset: function() {
    this.fields.reset();
    if (this.parent && this.parent.model && this.parent.model.documents) {
      this.parent.model.documents.reset();
    }
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
    options = _.defaults(options || {}, {
      size: 100,
      query: {},
      fields: null
    });

    wrapError(this, options);

    var model = this;
    window.schema = this;

    /**
     * Collection of sampled documents someone else wants to keep track of.
     *
     * {@see scout-ui/src/home/collection.js#model}
     * @todo (imlucas): Yes this is a crappy hack.
     */
    var documents;
    if (this.parent && this.parent.model && this.parent.model.documents) {
      documents = this.parent.model.documents;
    }

    var parser = this.stream()
      .on('error', function(err) {
        options.error(err, 'error', err.message);
      })
      .on('data', function(doc) {
        if (documents) {
          documents.add(doc);
        }
      })
      .on('end', function() {
        model.trigger('sync', model, model.serialize(), options);
      });

    model.trigger('request', model, {}, options);
    app.client.sample(model.ns, options)
      .on('error', parser.emit.bind(parser, 'error'))
      .pipe(parser);
  }
});
