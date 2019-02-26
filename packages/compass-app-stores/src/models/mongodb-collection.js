import MongoDBCollection from 'mongodb-collection-model';
import toNS from 'mongodb-ns';
import clientMixin from './mongodb-scope-client-mixin';
import util from 'util';
const format = util.format;

/**
 * Metadata for a MongoDB Collection.
 * @see http://npm.im/mongodb-collection-model
 */
const CollectionModel = MongoDBCollection.extend(clientMixin, {
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

export default CollectionModel;

export const Collection = MongoDBCollection.Collection.extend({
  model: CollectionModel
});
