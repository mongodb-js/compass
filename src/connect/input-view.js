var InputView = require('ampersand-input-view');
var _ = require('lodash');

// var debug = require('debug')('scout:connect:input-view');

/**
 * Need to overwrite render() method and pass in `this` for renderWithTemplate(), so that
 * label gets correctly rendered on subsequent render() calls.
 */
module.exports = InputView.extend({
  initialize: function() {
    this.invalidClass = 'has-error';
    this.validityClassSelector = '.form-item';
    InputView.prototype.initialize.apply(this, arguments);
  },
  render: function() {
    this.renderWithTemplate(this);
    this.input = this.query('input') || this.query('textarea');
    // switches out input for textarea if that's what we want
    this.handleTypeChange();
    this.initInputBindings();
    // Skip validation on initial setValue
    // if the field is not required
    this.setValue(this.inputValue, !this.required);
    return this;
  },
  clean: function(val) {
    if (this.type === 'number') {
      return Number(val);
    } else if (this.type === 'string') {
      return val.trim();
    }
    return val;
  },
  /**
   * overwriting InputView#beforeSubmit to handle `file` type correctly.
   * For `file` type, the input view returns the actual path (provided by
   * electron) rather than the browser fake path.
   * @see https://github.com/atom/electron/blob/master/docs/api/file-object.md
   */
  beforeSubmit: function() {
    var value;
    if (this.type === 'file') {
      value = _.chain(this.input.files)
        .map(function(file) {
          return _.get(file, 'path', null);
        })
        .filter()
        .value();
      if (value.length === 0) {
        value = '';
      }
    } else {
      value = this.input.value;
    }
    this.inputValue = this.clean(value);
    this.shouldValidate = true;
    this.runTests();
  }
});
