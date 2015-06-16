var htmlStringify = require('html-stringify');
var AmpersandView = require('ampersand-view');

var DocumentListItemView = AmpersandView.extend({
  derived: {
    document_html: {
      deps: ['model'],
      fn: function() {
        return htmlStringify(this.model.serialize());
      }
    }
  },
  bindings: {
    document_html: {
      hook: 'document_html',
      type: 'innerHTML'
    }
  },
  template: require('./document-list-item.jade')
});


module.exports = AmpersandView.extend({
  template: require('./document-list.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, DocumentListItemView, this.queryByHook('documents'));
  }
});

