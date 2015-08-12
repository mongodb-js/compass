var View = require('ampersand-view');
module.exports = View.extend({
  events: {
    'click [data-hook=continue]': 'onContinueClicked'
  },
  template: require('./connect-mongodb.jade'),
  onContinueClicked: function(evt) {
    evt.preventDefault();
    this.parent.step++;
  }
});
