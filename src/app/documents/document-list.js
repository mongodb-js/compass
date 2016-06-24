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
    var container = this.el.parentNode.parentNode.parentNode;
    ReactDOM.render(React.createElement(this.documentList), container);
    return this;
  },
  reset: function() {
    Action.filterChanged({});
    this.loading = false;
  },
  remove: function() {
    View.prototype.remove.call(this);
  }
});
module.exports = DocumentListView;
