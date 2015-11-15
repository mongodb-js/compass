var InputView = require('ampersand-input-view');
// var debug = require('debug')('scout:connect:input-view');

/**
 * Need to overwrite render() method and pass in `this` for renderWithTemplate()
 * so that label gets correctly rendered on subsequent render() calls.
 */
module.exports = InputView.extend({
  props: {
    helpEntry: {
      type: 'string',
      default: null
    }
  },
  initialize: function(spec) {
    spec = spec || {};
    if (spec.helpEntry) {
      this.helpEntry = spec.helpEntry;
    }
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
  }
});
