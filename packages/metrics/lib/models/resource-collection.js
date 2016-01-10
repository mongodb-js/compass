var Collection = require('ampersand-collection');
var BaseResource = require('../resources/base');
var lodashMixin = require('ampersand-collection-lodash-mixin');

module.exports = Collection.extend(lodashMixin, {
  mainAttribute: 'id',
  model: BaseResource
});
