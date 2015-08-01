var View = require('ampersand-view');
var debug = require('debug')('scout:first-run:user-info');

module.exports = View.extend({
  events: {
    'click [data-hook=continue]': 'onContinueClicked'
  },
  template: require('./user-info.jade'),
  onContinueClicked: function(evt) {
    evt.preventDefault();
    debug('validitity?', this.form.checkValidity());
    debugger;
  },
  render: function() {
    this.renderWithTemplate();
    this.form = this.query('form');
    this.emailInput = this.query('input[name=email]');
    this.nameInput = this.query('input[name=name]');

    setTimeout(function() {
      this.nameInput.focus();
    }.bind(this), 400);
    this.form.addEventListener('submit', function(event) {
      debug('validitity?', this.checkValidity());
      event.preventDefault();
    }, false);
  }
});
