var Instance = require('./instance');
var AmpersandCollection = require('ampersand-collection');

var InstanceCollection = AmpersandCollection.extend({
  model: Instance
});

module.exports = InstanceCollection;
