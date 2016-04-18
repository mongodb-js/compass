var View = require('ampersand-view');
var SampledDocumentCollection = require('../models/sampled-document-collection');
var DocumentListItemView = require('./document-list-item');
var app = require('ampersand-app');
var debug = require('debug')('mongodb-compass:document-list');

var documentListTemplate = require('./document-list.jade');

var DocumentListView = View.extend({
  template: documentListTemplate,
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
  initialize: function() {
    this.listenTo(app.queryOptions, 'change:query', this.onQueryChanged.bind(this));
  },
  onQueryChanged: function() {
    this.documents.reset();
    this.loadDocuments();
  },
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.documents, DocumentListItemView,
      this.queryByHook('document-list-container'));

    var scrollContainer = this.el.parentNode;
    scrollContainer.addEventListener('scroll', function() {
      this.onViewerScroll(scrollContainer);
    }.bind(this));

    return this;
  },
  /**
   * When the DOM element scrolls, check to see if it's within 100px of the bottom.
   * If it is, load more documents.
   *
   * @param {Element} docListEl The element in the DOM that was scrolled.
   */
  onViewerScroll: function(docListEl) {
    // scrollHeight: total height including off-screen content.
    // scrollTop:    total distance between the top and the visible content.
    // clientHeight: total height of the element on screen.
    if (docListEl.scrollHeight - docListEl.scrollTop <= docListEl.clientHeight + 100) {
      this.loadDocuments();
    }
  },
  /**
   * Incrementally loads the documents present in the sample schema into the doc viewer.
   */
  loadDocuments: function() {
    // If this is already loading more documents, do nothing.
    if (this.loading) {
      return;
    }
    // If namespace not set yet, do nothing.
    var ns = this.model.getId();
    if (!ns) {
      return;
    }
    this.loading = true;
    var query = app.queryOptions.query.serialize();
    var options = {
      skip: this.documents.length,
      limit: 20
    };
    app.dataService.find(ns, query, options, function(err, documents) {
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
  },
  remove: function() {
    var scrollContainer = this.el.parentNode;
    scrollContainer.removeEventListener('scroll');
    View.prototype.remove.call(this);
  }
});
module.exports = DocumentListView;
