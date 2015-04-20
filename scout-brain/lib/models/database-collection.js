var AmpersandCollection = require('ampersand-collection');
var Database = require('./database');

var DatabaseCollection = AmpersandCollection.extend({
  model: Database
});

module.exports = DatabaseCollection;
