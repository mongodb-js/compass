var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var Connection = require('./connection');
var connectionSync = require('./connection-sync')();
var restMixin = require('ampersand-collection-rest-mixin');

module.exports = Collection.extend(lodashMixin, restMixin, {
  namespace: 'ConnectionCollection',
  model: Connection,
  comparator: 'last_used',
  mainIndex: 'uri',
  sync: connectionSync
});
