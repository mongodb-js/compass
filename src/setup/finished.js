var View = require('ampersand-view');
module.exports = View.extend({
  events: {
    'click [data-hook=continue]': 'onContinueClicked'
  },
  template: require('./finished.jade'),
  onContinueClicked: function(evt) {
    evt.preventDefault();
    this.parent.complete();
  }
});
