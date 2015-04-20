var AmpersandCollection = require('ampersand-collection');

var DocumentCollection = AmpersandCollection.extend({
  model: require('./document')
});

module.exports = DocumentCollection;
