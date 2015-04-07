var Deployment = require('./deployment'),
  AmpersandCollection = require('ampersand-collection');

var DeploymentCollection = AmpersandCollection.extend({
  model: Deployment
});

module.exports = DeploymentCollection;
