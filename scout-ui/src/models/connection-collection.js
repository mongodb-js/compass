var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var Connection = require('./connection');
var connectionSync = require('./connection-sync');

module.exports = Collection.extend(lodashMixin, {
  namespace: 'ConnectionCollection',
  model: Connection,
  comparator: 'last_used',
  mainIndex: 'name',
  sync: connectionSync
});
