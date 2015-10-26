var selectableMixin = require('../../models/selectable-collection-mixin');
var Collection = require('ampersand-rest-collection');
var AuthenticationOption = require('./authentication-option');

var AuthenticationOptionCollection = Collection.extend(selectableMixin, {
  model: AuthenticationOption,
  mainIndex: '_id'
});

module.exports = AuthenticationOptionCollection;
