var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var Connection = require('./connection');
var connectionSync = require('./connection-sync')();
var restMixin = require('ampersand-collection-rest-mixin');

module.exports = Collection.extend(lodashMixin, restMixin, {
  namespace: 'ConnectionCollection',
  model: Connection,
  comparator: function(model) {
    return -model.last_used;
  },
  mainIndex: '_id',
  indexes: ['name'],
  sync: connectionSync
});
