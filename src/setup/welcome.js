var View = require('ampersand-view');
module.exports = View.extend({
  events: {
    'click [data-hook=continue]': 'onContinueClicked'
  },
  template: require('./welcome.jade'),
  onContinueClicked: function(evt) {
    evt.preventDefault();
    this.parent.step++;
  },
  render: function() {
    this.renderWithTemplate();
    setTimeout(function() {
      this.queryByHook('leaf').classList.add('rubberBand');
    }.bind(this), 500);
  }
});
