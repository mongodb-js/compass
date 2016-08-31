var State = require('ampersand-state');
var HelpEntryCollection = require('./help-entry-collection');

// var debug = require('debug')('mongodb-compass:models:help-section');

var HelpSection = State.extend({
  namespace: 'HelpSection',
  idAttribute: 'name',
  props: {
    name: 'string',
    devOnly: 'boolean'
  },
  collections: {
    entries: HelpEntryCollection
  },
  parse: function(attrs) {
    return attrs;
  }
});

module.exports = HelpSection;
