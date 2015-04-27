var brain = require('../../../scout-brain');
var client = require('../../../scout-client')();
var WithScout = require('./with-scout');
var WithSelectable = require('./with-selectable');
var debug = require('debug')('scout-ui:models');
var core = brain.models;
var types = brain.types;
var _ = require('underscore');
var es = require('event-stream');

window.scout = client;

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
    .pipe(es.wait(function(err, data){
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
  SampledDocumentCollection: SampledDocumentCollection
};
