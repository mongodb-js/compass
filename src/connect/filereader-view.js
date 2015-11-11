var InputView = require('./input-view');
var _ = require('lodash');
var path = require('path');
var remote = window.require('remote');
var dialog = remote.require('dialog');
var format = require('util').format;
var bindings = require('ampersand-dom-bindings');
var fileReaderTemplate = require('./filereader-default.jade');

// var debug = require('debug')('scout:connect:filereader-view');

module.exports = InputView.extend({
  template: fileReaderTemplate,
  props: {
    inputValue: {
      type: 'array',
      required: true,
      default: function() {
        return [];
      }
    },
    removed: {
      type: 'boolean',
      required: true,
      default: false
    }
  },
  derived: {
    buttonTitle: {
      deps: ['inputValue'],
      fn: function() {
        if (this.inputValue.length === 0) {
          return 'Choose certificate(s)';
        } else if (this.inputValue.length === 1) {
          return path.basename(this.inputValue[0]);
        }
        return format('%d files selected', this.inputValue.length);
      }
    },
    numSelectedFiles: {
      deps: ['inputValue'],
      fn: function() {
        return this.inputValue.length;
      }
    }
  },
  events: {
    'click [data-hook=load-file-button]': 'loadFileButtonClicked'
  },
  bindings: {
    buttonTitle: {
      type: 'text',
      hook: 'button-label'
    },
    'label': [
      {
        hook: 'label'
      },
      {
        type: 'toggle',
        hook: 'label'
      }
    ],
    'message': {
      type: 'text',
      hook: 'message-text'
    },
    'showMessage': {
      type: 'toggle',
      hook: 'message-container'
    }
  },
  /**
   * Set value to empty array in spec, instead of '', set appropriate
   * invalidClass and validityClassSelector and always validate.
   * @param {Object} spec    the spec to set up this input view
   */
  initialize: function(spec) {
    spec = spec || {};
    _.defaults(spec, {value: []});
    this.invalidClass = 'has-error';
    this.validityClassSelector = '.form-item-file';
    InputView.prototype.initialize.call(this, spec);
  },
  /**
   * @todo (thomasr)
   * Because ampersand-input-view still uses ampersand-view@8.x where
   * the render/remove/render cycle doesn't correctly set up the bindings
   * again, we need to re-initialize the bindings manually here. Once they
   * upgrade to ampersand-view@9.x we can probably remove this entire
   * render method.
   *
   * @return {Object}  this
   */
  render: function() {
    this.renderWithTemplate(this);
    this.input = this.queryByHook('load-file-button');
    if (this.removed) {
      this._parsedBindings = bindings(this.bindings, this);
      this._initializeBindings();
      this.removed = false;
    }
    this.setValue(this.inputValue, !this.required);
    return this;
  },
  /**
   * Turn into no-op, as we don't work on input elements
   * @see ampersand-input-view.js#handleTypeChange
   */
  handleTypeChange: function() {
  },
  /**
   * Turn into identity, as we don't need to trim the value
   * @param  {Array} val   the value to pass through
   * @return {Array}       return the unchanged value
   */
  clean: function(val) {
    return val;
  },
  /**
   * Turn into no-op, as we don't work on input elements
   * @see ampersand-input-view.js#initInputBindings
   */
  // initInputBindings: function() {
  // },
  /**
   * Only call ampersand-view's remove, we don't need to remove event listeners
   * @see ampersand-input-view.js#remove
   */
  remove: function() {
    this.removed = true;
    InputView.prototype.remove.apply(this, arguments);
  },
  /**
   * Not setting this.input.value here because our this.input is a div
   * @param {Array} value     the value to assign to this.inputValue
   * @param {Boolean} skipValidation    whether it should be validated or not
   * @see ampersand-input-view.js#setValue
   */
  setValue: function(value, skipValidation) {
    this.inputValue = value;
    if (!skipValidation && !this.getErrorMessage()) {
      this.shouldValidate = true;
    } else if (skipValidation) {
      this.shouldValidate = false;
    }
  },
  /**
   * Need to change the value empty check to empty arrays instead
   * @return {String} error message
   * @see ampersand-input-view.js#getErrorMessage
   */
  getErrorMessage: function() {
    var message = '';
    if (this.required && this.value.length === 0) {
      return this.requiredMessage;
    }
    (this.tests || []).some(function(test) {
      message = test.call(this, this.value) || '';
      return message;
    }, this);
    return message;
  },
  /**
   * Don't access this.input.value as we don't work on input elements
   * @see ampersand-input-view.js#beforeSubmit
   */
  beforeSubmit: function() {
    // at the point where we've tried to submit, we want to validate
    // everything from now on.
    this.shouldValidate = true;
    this.runTests();
  },
  loadFileButtonClicked: function() {
    dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections']
    }, function(filenames) {
      this.inputValue = filenames || [];
      this.handleChange();
    }.bind(this));
  }
});
