var AmpersandState = require('ampersand-state');
var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-collection');

var DocumentCollection = require('./document-collection');

var CollectionIndex = AmpersandState.extend({
  extraProperties: 'allow'
});

var CollectionIndexes = AmpersandCollection.extend({
  model: CollectionIndex
});

var Collection = AmpersandModel.extend({
  props: {
    _id: 'string',
    name: 'string',
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
  session: {
    selected: 'boolean'
  },
  extraProperties: 'allow',
  collections: {
    indexes: CollectionIndexes,
    documents: DocumentCollection
  }
});

module.exports = Collection;
