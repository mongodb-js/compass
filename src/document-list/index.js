var View = require('ampersand-view');
var SampledDocumentCollection = require('../models/sampled-document-collection');
var DocumentListItemView = require('./document-list-item');
var app = require('ampersand-app');
var debug = require('debug')('mongodb-compass:document-list');

var DocumentListView = View.extend({
  template: require('./index.jade'),
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
  onViewerScroll: function(docListEl) {
    if (docListEl.scrollHeight - docListEl.scrollTop <= docListEl.clientHeight + 30) {
      this.loadDocuments();
    }
  },
  getDocumentIds: function() {
    var _ids = this.parent.schema.documents.serialize().map(function(doc) { return doc._id; });
    return _ids;
  },
  loadDocuments: function() {
    if (this.loading) return;
    var _ids = this.getDocumentIds();
    if (this.documents.length >= _ids.length) return;
    this.loading = true;
    var ns = this.parent.parent.ns;
    var query = { _id: { '$in': _ids } };

    var options = {
      query: query,
      sort: { _id: -1 },
      skip: this.documents.length,
      limit: 20
    };
    this.cursor = app.client.find(ns, options, function(err, documents) {
      if (!this.loading) return;
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
