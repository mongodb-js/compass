var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-rest-collection');

var Database = AmpersandModel.extend({
  modelType: 'Database',
  idAttribute: '_id',
  props: {
    _id: 'string',
    document_count: 'number',
    document_size: 'number',
    storage_size: 'number',
    index_count: 'number',
    index_size: 'number',
    extent_count: 'number',
    file_size: 'number',
    ns_size: 'number'
  }
});

var DatabaseCollection = AmpersandCollection.extend({
  comparator: '_id',
  model: Database,
  modelType: 'DatabaseCollection'
});

module.exports = Database;
module.exports.Collection = DatabaseCollection;
