var MongoDBCollection = require('scout-brain').models.Collection;
var types = require('./types');
var clientMixin = require('./client-mixin');
var format = require('util').format;

/**
 * Metadata for a MongoDB Collection.
 * @see https://github.com/10gen/scout/blob/dev/scout-brain/lib/models/collection.js
 */
module.exports = MongoDBCollection.extend(clientMixin, {
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
        return types.ns(this._id).collection;
      }
    },
    specialish: {
      name: {
        deps: ['_id'],
        fn: function() {
          return types.ns(this._id).specialish;
        }
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
