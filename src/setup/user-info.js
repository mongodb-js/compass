var View = require('ampersand-view');
var app = require('ampersand-app');
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
    'change input': 'onInputChanged',
    'blur input': 'onInputBlur'
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
      app.user.save({
        name: this.nameInput.value,
        email: this.emailInput.value
      });
      this.parent.step++;
    }
  },
  onInputBlur: function(evt) {
    this.validateInput(evt.delegateTarget);
  },
  onInputChanged: function(evt) {
    if (!this.active_validation) return;
    this.validateInput(evt.delegateTarget);
  },
  validateInput: function(input) {
    debug('validating %s', input.name);
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
    debug('rendering');
    this.renderWithTemplate();
    this.form = this.query('form');
    this.emailInput = this.query('input[name=email]');
    this.nameInput = this.query('input[name=name]');
    this.listenTo(app.user, 'change:name', function() {
      this.nameInput.value = app.user.name;
    }.bind(this));

    this.listenTo(app.user, 'change:email', function() {
      this.emailInput.value = app.user.email;
    }.bind(this));

    setTimeout(function() {
      debug('Focusing on name input');
      this.nameInput.focus();
    }.bind(this), 400);
  }
});
