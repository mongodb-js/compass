var AmpersandModel = require('ampersand-model');

var Database = AmpersandModel.extend({
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

module.exports = Database;
