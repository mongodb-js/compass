var AmpersandCollection = require('ampersand-collection');

var CollectionCollection = AmpersandCollection.extend({
  model: require('./collection')
});

module.exports = CollectionCollection;
