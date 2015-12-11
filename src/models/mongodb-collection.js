var MongoDBCollection = require('mongodb-collection-model');
var toNS = require('mongodb-ns');
var clientMixin = require('./mongodb-scope-client-mixin');
var format = require('util').format;

/**
 * Metadata for a MongoDB Collection.
 * @see http://npm.im/mongodb-collection-model
 */
var CollectionModel = MongoDBCollection.extend(clientMixin, {
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
        return format('/collections/%s', this.getId());
      }
    }
  },
  serialize: function() {
    return this.getAttributes({
      props: true
    }, true);
  }
});

module.exports = CollectionModel;

module.exports.Collection = MongoDBCollection.Collection.extend({
  model: CollectionModel
});
