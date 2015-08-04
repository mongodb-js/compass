var View = require('ampersand-view');
var debug = require('debug')('scout:first-run:user-info');

module.exports = View.extend({
  props: {
    validated: {
      type: 'boolean',
      default: false
    }
  },
  events: {
    'click [data-hook=continue]': 'onContinueClicked'
  },
  template: require('./user-info.jade'),
  onContinueClicked: function(evt) {
    evt.preventDefault();
    this.validate();
    if (this.is_valid) {

    } else {

    }
  },
  validate: function() {
    this.validated = true;
    this.is_valid = this.form.checkValidity();
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
