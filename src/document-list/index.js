var View = require('ampersand-view');
var SampledDocumentCollection = require('../models/sampled-document-collection');
var DocumentListItemView = require('./document-list-item');
var app = require('ampersand-app');
var debug = require('debug')('mongodb-compass:document-list');
var jade = require('jade');
var path = require('path');

var indexTemplate = jade.compileFile(path.resolve(__dirname, 'index.jade'));

var DocumentListView = View.extend({
  template: indexTemplate,
  props: {
    loading: {
      type: 'boolean',
      default: false
    }
  },
  bindings: {
    loading: {
      type: 'toggle',
      hook: 'loading'
    }
  },
  collections: {
    documents: SampledDocumentCollection
  },
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.documents, DocumentListItemView,
      this.queryByHook('document-list-container'));
    return this;
  },
  /**
   * When the DOM element scrolls, check to see if it's within 30px of the bottom.
   * If it is, load more documents.
   *
   * @param {Element} docListEl The element in the DOM that was scrolled.
   */
  onViewerScroll: function(docListEl) {
    // scrollHeight: total height including off-screen content.
    // scrollTop:    total distance between the top and the visible content.
    // clientHeight: total height of the element on screen.
    if (docListEl.scrollHeight - docListEl.scrollTop <= docListEl.clientHeight + 30) {
      this.loadDocuments();
    }
  },
  /**
   * Returns an array of _id's currently present in the sampled schema.
   *
   * @return {Array}
   */
  getDocumentIds: function() {
    var _ids = [];
    // In case there are multiple types of _id's, we need to handle all of them.
    this.parent.schema.fields.get('_id').types.forEach(function(type) {
      _ids = _ids.concat(type.values.serialize());
    });
    return _ids;
  },
  /**
   * Incrementally loads the documents present in the sample schema into the doc viewer.
   */
  loadDocuments: function() {
    // If this is already loading more documents, do nothing.
    if (this.loading) {
      return;
    }
    var _ids = this.getDocumentIds();
    // If this already has all of the documents, do nothing.
    if (this.documents.length >= _ids.length) {
      return;
    }
    this.loading = true;
    var ns = this.parent.parent.ns;
    var query = {
      _id: {
        '$in': _ids
      }
    };

    var options = {
      query: query,
      sort: {
        _id: -1
      },
      skip: this.documents.length,
      limit: 20
    };
    app.client.find(ns, options, function(err, documents) {
      // If the document loading was canceled, do nothing.
      if (!this.loading) {
        return;
      }
      if (err) {
        debug('error reading document', err);
      }
      if (documents) {
        this.documents.add(documents);
      }
      this.loading = false;
    }.bind(this));
  },
  reset: function() {
    this.loading = false;
    this.documents.reset();
  }
});
module.exports = DocumentListView;
