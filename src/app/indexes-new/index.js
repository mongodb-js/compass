var View = require('ampersand-view');
var app = require('ampersand-app');
var React = require('react');
var ReactDOM = require('react-dom');

var IndexesNewView = View.extend({
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
    this.indexesView = app.appRegistry.getComponent('Component::Indexes::Indexes');
  },
  render: function() {
    ReactDOM.render(React.createElement(this.indexesView), this.queryByHook('indexes-new-subview'));
    return this;
  },
  remove: function() {
    View.prototype.remove.call(this);
  }
});

module.exports = IndexesNewView;
