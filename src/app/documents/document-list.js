var View = require('ampersand-view');
var app = require('ampersand-app');
var Action = require('hadron-action');
var React = require('react');
var ReactDOM = require('react-dom');

var DocumentListView = View.extend({
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
  initialize: function() {
    this.documentList = app.componentRegistry.findByRole('Collection:DocumentList')[0];
    this.listenTo(app.queryOptions, 'change:query', this.onQueryChanged.bind(this));
  },
  onQueryChanged: function() {
    Action.filterChanged(app.queryOptions.query.serialize());
  },
  render: function() {
    ReactDOM.render(React.createElement(this.documentList), this.el.parentNode);
    // this.renderCollection(this.documents, DocumentListItemView,
      // this.queryByHook('document-list-container'));

    // var scrollContainer = this.el.parentNode;
    // scrollContainer.addEventListener('scroll', function() {
      // this.onViewerScroll(scrollContainer);
    // }.bind(this));

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
    // if (docListEl.scrollHeight - docListEl.scrollTop <= docListEl.clientHeight + 100) {
      // this.loadDocuments();
    // }
  },
  reset: function() {
    Action.filterChanged({});
    this.loading = false;
  },
  remove: function() {
    // var scrollContainer = this.el.parentNode;
    // scrollContainer.removeEventListener('scroll');
    // View.prototype.remove.call(this);
  }
});
module.exports = DocumentListView;
