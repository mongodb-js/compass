var VizView = require('./viz');
var pluralize = require('pluralize');

var documentRootTemplate = require('../templates').minicharts['document-root'];
// var debug = require('debug')('mongodb-compass:minicharts:document-root');

module.exports = VizView.extend({
  template: documentRootTemplate,
  render: function() {
    var fieldNames = this.model.parent.fields.pluck('name');
    this.renderWithTemplate({
      fieldsPluralized: pluralize('nested field', fieldNames.length, true)
    });
  }
});
