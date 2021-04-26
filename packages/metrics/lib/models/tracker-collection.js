var Collection = require('ampersand-collection');
var State = require('ampersand-state');
var lodashMixin = require('ampersand-collection-lodash-mixin');

module.exports = Collection.extend(lodashMixin, {
  mainAttribute: 'id',
  model: State
});
