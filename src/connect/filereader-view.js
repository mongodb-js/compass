var InputView = require('./input-view');
var _ = require('lodash');
// var path = require('path');
var fileReaderTemplate = require('./filereader-default.jade');

// var debug = require('debug')('scout:connect:filereader-view');

module.exports = InputView.extend({
  template: fileReaderTemplate,
  clean: function() {
    var value;
    value = _.chain(this.input.files)
      .map(function(file) {
        return _.get(file, 'path', null);
      })
      .filter()
      .value();
    if (value.length === 0) {
      value = '';
    }
    return value;
  },
  setValue: function(value, skipValidation) {
    if (!this.input) {
      this.inputValue = value;
      return;
    }
    this.input.value = '';
    /**
     * Cannot set input value for file types. @see INT-780
     */
    // if (value || value === 0) {
    //   if (!_.isArray(value)) {
    //     value = [value];
    //   }
    //   if (value.length <= 1) {
    //     this.input.value = path.basename(value);
    //   } else {
    //     this.input.value = 'multiple files';
    //   }
    //   this.input.files = _.map(value, function(f) {
    //     return {
    //       name: path.basename(f),
    //       path: f
    //     };
    //   });
    // }
    this.inputValue = this.clean();
    if (!skipValidation && !this.getErrorMessage()) {
      this.shouldValidate = true;
    } else if (skipValidation) {
      this.shouldValidate = false;
    }
  },
  handleChange: function() {
    if (this.inputValue && this.changed) {
      this.shouldValidate = true;
    }
    // for `file` type input fields, this is the only event and we need
    // to set this.inputValue here again.
    this.inputValue = this.clean();
    this.runTests();
  }
});
