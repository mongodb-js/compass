var brain = require('../../../scout-brain');

var client = require('../../../scout-client')({
  seed: 'mongodb://localhost:27017'
});

var WithScout = require('./with-scout');
var WithSelectable = require('./with-selectable');
var debug = require('debug')('scout-ui:models');
var core = brain.models;
var types = brain.types;
var _ = require('underscore');
var es = require('event-stream');
var Schema = require('mongodb-schema').Schema;
var FieldCollection = require('mongodb-schema').FieldCollection;
var Field = require('mongodb-schema/lib/field');
var QueryOptions = require('./query-options');
var filterableMixin = require('ampersand-collection-filterable');

// Yay!  Use the API from the devtools console.
window.scout = client;

// The currently active schema.
window.schema = null;

var wrapError = require('./wrap-error');

/**
 * Catch-all for any client errors so we just log them instead of
 * stopping the app.
 */
client.on('error', function(err) {
  console.error(err);
});

/**
 * wrapping mongodb-schema's FieldCollection with a filterable mixin
 */
var FilterableFieldCollection = FieldCollection.extend(filterableMixin, {
  // @todo, this should be in mongodb-schema FieldCollection
  // but FieldCollection will soon not be polymorphic anymore, so the
  // problem will go away and we can remove this.
  isModel: function (model) {
    return model instanceof Field;
  }
});

var SampledSchema = Schema.extend({
  /**
   * Our fields need to be filterable, adding a mixin
   */
  collections: {
    fields: FilterableFieldCollection
  },
  /**
   * Clear any data accumulated from sampling.
   */
  reset: function(options) {
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
   */
  more: function(options) {
    this.fetch(options);
  },
  /**
   * Get a sample of documents for a collection from the server.
   * Really this should only be called directly from the `initialize` function
   *
   * @param {Object} [options]
   * @option {Number} [size=100] Number of documents the sample should contain.
   * @option {Object} [query={}]
   * @option {Object} [fields=null]
   */
  fetch: function(options) {
    options = _.defaults((options || {}), {
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
    client.sample(model.ns, options)
      .on('error', parser.emit.bind(parser, 'error'))
      .pipe(parser);
  }
});

var SampledDocumentCollection = core.DocumentCollection.extend({
  initialize: function() {
    //!(this.parent instanceof InstanceCollection)
    if (!this.parent) {
      throw new TypeError('SampledDocumentCollection must be used from a parent Collection.');
    }
  },
  fetch: function(options) {
    var model = this;
    var success = options.success;

    options = _.defaults((options ? _.clone(options) : {}), {
      size: 5,
      query: {},
      fields: null
    });

    client.sample(this.parent._id, options)
      .pipe(es.map(function(doc, cb) {
        model.add(doc);
        cb(null, doc);
      }))
      .pipe(es.wait(function(err, data) {
        if (err) return options.error({}, 'error', err.message);
        if (success) {
          success(model, data, options);
        }
        model.trigger('sync', model, data, options);
      }));
  }
});

var Collection = core.Collection.extend({
  session: {
    selected: {
      type: 'boolean',
      default: false
    }
  },
  children: {
    documents: SampledDocumentCollection
  },
  derived: {
    name: {
      deps: ['_id'],
      fn: function() {
        debug('%s -> %j', this._id, brain.types.ns(this._id));
        return brain.types.ns(this._id).collection;
      }
    },
    specialish: {
      name: {
        deps: ['_id'],
        fn: function() {
          debug('%s -> %j', this._id, brain.types.ns(this._id));
          return brain.types.ns(this._id).specialish;
        }
      }
    }
  },
  scout: function() {
    return client.collection.bind(client, this.getId());
  }
}, WithScout);

module.exports = {
  types: brain.types,
  Collection: Collection,
  Instance: core.Instance.extend({
    children: {
      collections: core.CollectionCollection.extend(WithSelectable, {
        model: Collection,
        parse: function(res) {
          // Hide specialish namespaces (eg `local.*`, `*oplog*`) from sidebar.
          return res.filter(function(d) {
            return !types.ns(d._id).specialish;
          });
        }
      })
    },
    scout: function() {
      return client.instance.bind(client);
    }
  }, WithScout),
  SampledDocumentCollection: SampledDocumentCollection,
  SampledSchema: SampledSchema,
  QueryOptions: QueryOptions
};
