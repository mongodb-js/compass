var VizView = require('./viz');
var pluralize = require('pluralize');
// var debug = require('debug')('scout:minicharts:document-root');

module.exports = VizView.extend({
  template: require('./document-root.jade'),
  render: function() {
    var fieldNames = this.model.parent.fields.pluck('name');
    this.renderWithTemplate({
      fieldsPluralized: pluralize('nested field', fieldNames.length, true)
    });
  }
});
