var AmpersandView = require('ampersand-view'),
  models = require('../models');

module.exports = AmpersandView.extend({
  template: require('./index.jade')
});
