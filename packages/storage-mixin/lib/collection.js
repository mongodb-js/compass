var Collection = require('ampersand-rest-collection');
var Preference = require('./model');

var PreferenceCollection = Collection.extend({
  model: Preference
});

module.exports = PreferenceCollection;
