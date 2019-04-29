var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-rest-collection');
var IndexCollection = require('mongodb-index-model').Collection;
var ns = require('mongodb-ns');
var each = require('lodash.foreach');

var Collection = AmpersandModel.extend({
  modelType: 'Collection',
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      required: true
    },
    database: 'string',
    document_count: 'number',
    document_size: 'number',
    storage_size: 'number',
    index_count: 'number',
    index_size: 'number',
    padding_factor: 'number',
    extent_count: 'number',
    extent_last_size: 'number',
    readonly: {
      type: 'boolean',
      default: false
    },
    collation: {
      type: 'object',
      default: null
    },
    /**
     * http://docs.mongodb.org/manual/reference/command/collStats/#collStats.userFlags
     */
    flags_user: 'number',
    flags_system: 'number',
    /**
     * Is this a capped collection?
     */
    capped: {
      type: 'boolean',
      default: false
    },
    /**
     * Is this collection using power of 2 allocation?
     *
     * http://docs.mongodb.org/manual/core/storage/#power-of-2-allocation
     */
    power_of_two: {
      type: 'boolean',
      default: true
    },
    /**
     * The total size in memory of all records in a collection. This value does
     * not include the record header, which is 16 bytes per record, but does
     * include the record’s padding. Additionally size does not include the
     * size of any indexes associated with the collection, which the
     * totalIndexSize field reports..
     *
     * http://docs.mongodb.org/manual/reference/command/collStats/#collStats.size
     */
    size: 'number',
    /**
     * New in version 3.0.0.
     *
     * A document that reports data from the storage engine for each index
     * in the collection.
     *
     * The fields in this document are the names of the indexes, while the
     * values themselves are documents that contain statistics for the index
     * provided by the storage engine. These statistics are for
     * internal diagnostic use.
     *
     * http://docs.mongodb.org/manual/reference/command/collStats/#collStats.indexDetails
     */
    index_details: 'object',
    /**
     * New in version 3.0.0.
     *
     * wiredTiger only appears when using the wiredTiger storage engine. This
     * document contains data reported directly by the WiredTiger engine and
     * other data for internal diagnostic use.
     *
     * http://docs.mongodb.org/manual/reference/command/collStats/#collStats.wiredTiger
     */
    wired_tiger: 'object',
    type: {
      type: 'string',
      default: 'collection'
    },
    view_on: {
      type: 'string',
      default: undefined
    },
    pipeline: {
      type: 'array',
      default: undefined
    }
  },
  collections: {
    indexes: IndexCollection
  },
  derived: {
    document_size_average: {
      deps: ['document_size', 'document_count'],
      fn: function() {
        return this.document_size / this.document_count;
      }
    },
    index_size_average: {
      deps: ['index_size', 'index_count'],
      fn: function() {
        return this.index_size / this.index_count;
      }
    },
    name: {
      deps: ['_id'],
      fn: function() {
        if (!this._id) {
          return undefined;
        }
        return ns(this._id).collection;
      }
    },
    specialish: {
      deps: ['_id'],
      fn: function() {
        if (!this._id) {
          return undefined;
        }
        return ns(this._id).specialish;
      }
    }
  },
  serialize: function() {
    var res = this.getAttributes(
      {
        props: true,
        derived: true
      },
      true
    );

    each(
      this._children,
      function(value, key) {
        res[key] = this[key].serialize();
      },
      this
    );
    each(
      this._collections,
      function(value, key) {
        res[key] = this[key].serialize();
      },
      this
    );
    return res;
  }
});

var CollectionCollection = AmpersandCollection.extend({
  comparator: '_id',
  model: Collection,
  modelType: 'CollectionCollection'
});

module.exports = Collection;
module.exports.Collection = CollectionCollection;
