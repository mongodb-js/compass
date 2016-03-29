var Model = require('ampersand-model');
var Collection = require('ampersand-rest-collection');
var format = require('util').format;

var IndexField = Model.extend({
  namespace: 'IndexType',
  idAttribute: 'id',
  props: {
    field: 'string',
    value: {
      type: 'any',
      values: [1, -1, '2dsphere', '2d', 'geoHaystack', 'text', 'hashed']
    }
  },
  derived: {
    id: {
      deps: ['field', 'value'],
      fn: function() {
        return format('%s_%s', this.field, this.value);
      }
    }
  }
});

var IndexFieldCollection = Collection.extend({
  model: IndexField
});

module.exports = IndexField;
module.exports.Collection = IndexFieldCollection;
