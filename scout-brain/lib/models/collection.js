var AmpersandState = require('ampersand-state');
var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-collection');
var debug = require('debug')('scout-brain:models:collection');

var types = require('../types');

// @todo: When schema for Index finalized in server,
// make them real props here.
var CollectionIndex = AmpersandState.extend({
  extraProperties: 'allow'
});

var CollectionIndexes = AmpersandCollection.extend({
  model: CollectionIndex
});

var Collection = AmpersandModel.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      required: true
    },
    database: 'string',
    index_sizes: 'number',
    document_count: 'number',
    document_size: 'number',
    storage_size: 'number',
    index_count: 'number',
    index_size: 'number',
    padding_factor: 'number',
    extent_count: 'number',
    extent_last_size: 'number',
    flags_user: 'number',
    flags_system: 'number'
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
  },
});

module.exports = Collection;
