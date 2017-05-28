const selectableMixin = require('../../models/selectable-collection-mixin');
const Collection = require('ampersand-rest-collection');
const ReadPreferenceOption = require('./read-preference-option');

const ReadPreferenceOptionCollection = Collection.extend(selectableMixin, {
  model: ReadPreferenceOption,
  mainIndex: '_id'
});

module.exports = ReadPreferenceOptionCollection;
