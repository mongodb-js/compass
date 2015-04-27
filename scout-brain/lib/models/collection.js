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
  // extraProperties: 'reject',
  collections: {
    indexes: CollectionIndexes
  },
  derived: {
    name: {
      deps: ['_id'],
      fn: function() {
        debug('%s -> %j', this._id, types.ns(this._id));
        return types.ns(this._id).collection;
      }
    },
    specialish: {
      name: {
        deps: ['_id'],
        fn: function() {
          debug('%s -> %j', this._id, types.ns(this._id));
          return types.ns(this._id).specialish;
        }
      }
    }
  }
});

module.exports = Collection;
