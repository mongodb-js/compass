var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-rest-collection');

var Index = AmpersandModel.extend({
  modelType: 'Index',
  idAttribute: '_id',
  props: {
    key: 'object',
    name: 'string',
    ns: 'string',
    v: 'number',
    size: 'number'
  },
  derived: {
    _id: {
      deps: ['name', 'ns'],
      fn: function() {
        return this.ns + '.' + this.name;
      }
    }
  }
});

var IndexCollection = AmpersandCollection.extend({
  comparator: '_id',
  model: Index,
  modelType: 'IndexCollection'
});

module.exports = Index;
module.exports.Collection = IndexCollection;
