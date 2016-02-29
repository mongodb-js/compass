var VizView = require('./viz');
var pluralize = require('pluralize');
var jade = require('jade');
var path = require('path');

var documentRootTemplate = jade.compileFile(path.resolve(__dirname, 'document-root.jade'));
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
