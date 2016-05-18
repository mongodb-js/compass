var selectableMixin = require('../../models/selectable-collection-mixin');
var Collection = require('ampersand-rest-collection');
var SSHTunnelOption = require('./ssh-tunnel-option');

var SSHTunnelOptionCollection = Collection.extend(selectableMixin, {
  model: SSHTunnelOption,
  mainIndex: '_id'
});

module.exports = SSHTunnelOptionCollection;
