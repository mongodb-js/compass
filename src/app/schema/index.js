var View = require('ampersand-view');
var app = require('ampersand-app');
var React = require('react');
var ReactDOM = require('react-dom');

var SchemaView = View.extend({
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
    this.schemaView = app.appRegistry.getComponent('Collection:Schema');
  },
  render: function() {
    ReactDOM.render(React.createElement(this.schemaView), this.queryByHook('schema-subview'));
    return this;
  },
  remove: function() {
    View.prototype.remove.call(this);
  }
});

module.exports = SchemaView;
