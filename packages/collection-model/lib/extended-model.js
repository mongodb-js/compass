var MongoDBCollection = require('./collection-model');
var toNS = require('mongodb-ns');
var clone = require('lodash.clone');
var raf = require('raf');

/**
 * Metadata for a MongoDB Collection.
 * @see http://npm.im/mongodb-collection-model
 */
var CollectionModel = MongoDBCollection.extend({
  namespace: 'MongoDBCollection',
  session: {
    selected: {
      type: 'boolean',
      default: false
    }
  },
  derived: {
    name: {
      deps: ['_id'],
      fn: function() {
        return toNS(this._id).collection;
      }
    },
    specialish: {
      deps: ['_id'],
      fn: function() {
        return toNS(this._id).specialish;
      }
    },
    url: {
      deps: ['_id'],
      fn: function() {
        return `/collections/${this.getId()}`;
      }
    }
  },
  serialize: function() {
    return this.getAttributes(
      {
        props: true
      },
      true
    );
  },
  fetch: function(options) {
    var model = this;

    options = options ? clone(options) : {};
    if (!options.parse) {
      options.parse = true;
    }

    var success = options.success;
    options.success = function(resp) {
      if (!model.set(model.parse(resp, options), options)) {
        return false;
      }
      if (success) {
        success(model, resp, options);
      }
      model.trigger('sync', model, resp, options);
    };

    var fn = options.error;
    options.error = function(resp) {
      if (fn) {
        fn(this, resp, options);
      }
      this.trigger('error', this, resp, options);
    };

    var done = function(err, res) {
      if (err) {
        return options.error({}, 'error', err.message);
      }
      raf(function onClientSuccess() {
        options.success(res, 'success', res);
      });
    };

    options.dataService.collection(this.getId(), options, done);
  }
});

module.exports = CollectionModel;

module.exports.Collection = MongoDBCollection.Collection.extend({
  model: CollectionModel
});
