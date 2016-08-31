var Collection = require('ampersand-rest-collection');
var HelpSection = require('./help-section');
var filterableMixin = require('ampersand-collection-filterable');

var HelpSectionCollection = Collection.extend(filterableMixin, {
  namespace: 'HelpSectionCollection',
  comparator: 'name',
  model: HelpSection
});

module.exports = HelpSectionCollection;
