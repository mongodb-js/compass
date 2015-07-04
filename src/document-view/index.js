
var AmpersandView = require('ampersand-view');
var JSObject = require('../object-tree/models').JSObject;
var JSObjectView = require('../object-tree/views').JSObjectView;

var DocumentListItemView = AmpersandView.extend({
  template: require('./document-list-item.jade'),
  subviews: {
    doc: {
      hook: 'doc-subview',
      waitFor: 'model',
      prepareView: function(el) {
        return new JSObjectView({
          el: el,
          // @todo store .collection as JSObjectCollection to avoid re-serialization
          model: new JSObject(this.model.serialize(), {
            parse: true
          })
        });
      }
    }
  }
});

module.exports = AmpersandView.extend({
  template: require('./document-list.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, DocumentListItemView, this.queryByHook('documents'));
  }
});

