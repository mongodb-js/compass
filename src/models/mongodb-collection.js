var MongoDBCollection = require('scout-brain').models.Collection;
var types = require('./types');
var scoutClientMixin = require('./scout-client-mixin');
var SampledDocumentCollection = require('./sampled-document-collection');
var app = require('ampersand-app');

/**
 * Metadata for a MongoDB Collection.
 * @see https://github.com/10gen/scout/blob/dev/scout-brain/lib/models/collection.js
 */
module.exports = MongoDBCollection.extend(scoutClientMixin, {
  namespace: 'MongoDBCollection',
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
    }
  },
  scout: function() {
    return app.client.collection.bind(app.client, this.getId());
  }
});
