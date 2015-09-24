var View = require('ampersand-view');
var Connection = require('../models/connection');

/**
 * View for a connection in the sidebar. It can be clicked (will copy details to the form view)
 * or it can be deleted via the X on the right side.
 */
var SidebarItemView = View.extend({
  namespace: 'SidebarItemView',
  props: {
    model: Connection,
    hover: {
      type: 'boolean',
      default: false
    }
  },
  events: {
    'click a': 'onClick',
    dblclick: 'onDoubleClick',
    mouseover: 'onMouseOver',
    mouseout: 'onMouseOut',
    'click [data-hook=close]': 'onCloseClick'
  },
  bindings: {
    'model.name': {
      hook: 'name'
    },
    hover: {
      type: 'toggle',
      hook: 'close'
    }
  },
  template: require('./connection.jade'),
  onClick: function(event) {
    this.parent.onItemClick(event, this.model);
  },
  onDoubleClick: function(event) {
    this.parent.onItemDoubleClick(event, this.model);
  },
  onCloseClick: function(event) {
    event.stopPropagation();
    event.preventDefault();
    this.model.destroy();
  },
  onMouseOver: function() {
    this.hover = true;
  },
  onMouseOut: function() {
    this.hover = false;
  }
});


/**
 * Renders all existing connections as list in the sidebar.
 */
var SidebarView = View.extend({
  namespace: 'SidebarView',
  template: require('./sidebar.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, SidebarItemView, this.queryByHook('connection-list'));
  },
  onItemClick: function(event, model) {
    event.stopPropagation();
    event.preventDefault();
    this.parent.onConnectionSelected(model);
  },
  onItemDoubleClick: function(event, model) {
    this.onItemClick(event, model);
    this.parent.connect(model);
  }
});

module.exports = SidebarView;
