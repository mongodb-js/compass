var VizView = require('./viz');
var _ = require('lodash');
var pluralize = require('pluralize');
var numeral = require('numeral');
var jade = require('jade');
var path = require('path');

var arrayRootTemplate = jade.compileFile(path.resolve(__dirname, 'array-root.jade'));
// var debug = require('debug')('mongodb-compass:minicharts:array-root');

module.exports = VizView.extend({
  template: arrayRootTemplate,
  render: function() {
    var parsed = {
      average_length: numeral(this.model.average_length).format('0.0[0]'),
      min_length: _.min(this.model.lengths),
      max_length: _.max(this.model.lengths)
    };
    if (this.model.parent.arrayFields) {
      parsed.fieldNames = this.model.parent.arrayFields.pluck('name');
      parsed.fieldsPluralized = pluralize('nested field', parsed.fieldNames.length, true);
    }
    this.renderWithTemplate(parsed);
  }
});
