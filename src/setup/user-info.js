var View = require('ampersand-view');
var debug = require('debug')('scout:first-run:user-info');

module.exports = View.extend({
  props: {
    validated: {
      type: 'boolean',
      default: false
    }
  },
  binding: {
    validated: {
      type: 'booleanClass',
      yes: 'validated'
    }
  },
  events: {
    'click [data-hook=continue]': 'onSubmit'
  },
  template: require('./user-info.jade'),
  onSubmit: function(evt) {
    debug('submitted');
    evt.preventDefault();
    this.validated = true;
    this.is_valid = this.form.checkValidity();

    var emailValid = this.validateInput(this.emailInput);
    debug('email valid?', emailValid);

    var nameValid = this.validateInput(this.nameInput);
    debug('name valid?', nameValid);

    debugger;
    if (this.is_valid) {

    }
  },
  validateInput: function(input) {
    var isValid = input.validity.valid;
    var toAdd;
    var toRemove;

    if (isValid) {
      toAdd = 'has-error';
      toRemove = 'has-success';
    } else {
      toAdd = 'has-success';
      toRemove = 'has-error';
    }
    input.parentNode.classList.add(toAdd);
    input.parentNode.classList.remove(toRemove);
    return isValid;
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
