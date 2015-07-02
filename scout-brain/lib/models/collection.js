var AmpersandModel = require('ampersand-model');
var _ = require('underscore');
var types = require('../types');
var IndexCollection = require('./_index-collection');

var Collection = AmpersandModel.extend({
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
    wired_tiger: 'object'
  },
  collections: {
    indexes: IndexCollection
  },
  derived: {
    document_size_average: {
      deps: ['document_size', 'document_count'],
      fn: function() {
        if (!this.document_size || !this.document_count) return;
        return this.document_size / this.document_count;
      }
    },
    index_size_average: {
      deps: ['index_size', 'index_count'],
      fn: function() {
        if (!this.index_size || !this.index_count) return;
        return this.index_size / this.index_count;
      }
    },
    name: {
      deps: ['_id'],
      fn: function() {
        if (!this._id) return undefined;
        return types.ns(this._id).collection;
      }
    },
    specialish: {
      deps: ['_id'],
      fn: function() {
        if (!this._id) return undefined;
        return types.ns(this._id).specialish;
      }
    }
  },
  parse: function(d) {
    // @todo: update scout-server to just do this.
    if (d.index_sizes) {
      _.each(d.indexes, function(data, name) {
        d.indexes[name].size = d.index_sizes[name];
      });
    }
    return d;
  },
  serialize: function() {
    var res = this.getAttributes({
      props: true,
      derived: true
    }, true);

    _.each(this._children, function(value, key) {
      res[key] = this[key].serialize();
    }, this);
    _.each(this._collections, function(value, key) {
      res[key] = this[key].serialize();
    }, this);
    return res;
  }
});

module.exports = Collection;
