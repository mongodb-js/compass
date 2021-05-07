var Model = require('ampersand-model');
var Collection = require('ampersand-rest-collection');
var format = require('util').format;

var IndexField = Model.extend({
  namespace: 'IndexType',
  idAttribute: 'id',
  props: {
    field: 'string',
    value: {
      type: 'any'
    }
  },
  derived: {
    id: {
      deps: ['field', 'value'],
      fn: function() {
        return format('%s_%s', this.field, this.value);
      }
    },
    geo: {
      deps: ['value'],
      fn: function() {
        return this.value === '2dsphere' ||
          this.value === '2d' ||
          this.value === 'geoHaystack';
      }
    }
  }
});

var IndexFieldCollection = Collection.extend({
  model: IndexField
});

module.exports = IndexField;
module.exports.Collection = IndexFieldCollection;
