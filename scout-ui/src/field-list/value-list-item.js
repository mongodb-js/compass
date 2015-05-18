var AmpersandView = require('ampersand-view');

module.exports = AmpersandView.extend({
  bindings: {
    'model._id': {
      hook: 'value'
    }
  },
  template: require('./value-list-item.jade')
});
