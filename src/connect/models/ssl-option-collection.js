var selectableMixin = require('./selectable-collection-mixin');
var Collection = require('ampersand-rest-collection');
var SslOption = require('./ssl-option');

var SslOptionCollection = Collection.extend(selectableMixin, {
  model: SslOption,
  mainIndex: '_id'
});
module.exports = SslOptionCollection;
