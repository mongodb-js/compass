var View = require('ampersand-view');
var DocumentListItemView = require('./document-list-item');
var debug = require('debug')('scout:document-view');

var DocumentListView = View.extend({
  template: require('./index.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, DocumentListItemView,
      this.queryByHook('document-list-container'));
  }
});
module.exports = DocumentListView;
