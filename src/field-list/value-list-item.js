var AmpersandView = require('ampersand-view');

module.exports = AmpersandView.extend({
  bindings: {
    'model.value': {
      hook: 'value'
    }
  },
  template: require('./value-list-item.jade')
});
