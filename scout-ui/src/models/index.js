var brain = require('../../../scout-brain');
var client = require('../../../scout-client')();
var WithScout = require('./with-scout');
var WithSelectable = require('./with-selectable');
var debug = require('debug')('scout-ui:models');
var core = brain.models;
var types = brain.types;
var _ = require('underscore');
var es = require('event-stream');
var Schema = require('mongodb-schema').Schema;

window.scout = client;

var wrapError = require('./wrap-error');

var SampledSchema = Schema.extend({
  fetch: function(options) {
    options = _.defaults((options || {}), {
      size: 5,
      query: {},
      fields: null
    });

    wrapError(this, options);

    var model = this;
    var detect = this.stream()
    .on('error', function(err) {
      options.error(err, 'error', err.message);
    })
    .on('end', function() {
      process.nextTick(function() {
        model.trigger('sync', model, model.serialize(), options);
      });
    });

    model.trigger('request', model, {}, options);
    process.nextTick(function() {
      client.sample(model.ns, options).pipe(detect);
    });
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
      if (success) success(model, data, options);
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
  }
});

module.exports = {
  types: brain.types,
  Collection: Collection,
  Instance: core.Instance.extend({
    children: {
      collections: core.CollectionCollection.extend(WithSelectable, {
        model: Collection,
        parse: function(res) {
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
  SampledSchema: SampledSchema
};
