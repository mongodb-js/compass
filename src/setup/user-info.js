var View = require('ampersand-view');
var debug = require('debug')('scout:first-run:user-info');

module.exports = View.extend({
  props: {
    active_validation: {
      type: 'boolean',
      default: false
    },
    is_valid: {
      type: 'boolean',
      default: true
    }
  },
  bindings: {
    is_valid: {
      hook: 'continue',
      type: 'booleanClass',
      no: 'disabled'
    }
  },
  events: {
    'click [data-hook=continue]': 'onSubmit',
    'change input': 'onInputChanged'
  },
  template: require('./user-info.jade'),
  onSubmit: function(evt) {
    debug('submitted');
    evt.preventDefault();
    this.active_validation = true;

    var emailValid = this.validateInput(this.emailInput);
    debug('email valid?', emailValid);

    var nameValid = this.validateInput(this.nameInput);
    debug('name valid?', nameValid);

    if (this.is_valid) {
      this.parent.set({
        name: this.nameInput.value,
        email: this.emailInput.value
      });
      this.parent.step++;
    }
  },
  onInputChanged: function(evt) {
    if (!this.active_validation) return;
    this.validateInput(evt.delegateTarget);
  },
  validateInput: function(input) {
    var isValid = input.validity.valid;
    var toAdd;
    var toRemove;

    if (!isValid) {
      toAdd = 'has-error';
      toRemove = 'has-success';
    } else {
      toAdd = 'has-success';
      toRemove = 'has-error';
    }
    input.parentNode.classList.add(toAdd);
    input.parentNode.classList.remove(toRemove);
    this.is_valid = this.form.checkValidity();

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
  }
});
