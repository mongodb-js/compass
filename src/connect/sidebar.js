var View = require('ampersand-view');
var Connection = require('../models/connection');

/**
 * View for a connection in the sidebar. It can be clicked (will copy details to the form view)
 * or it can be deleted via the X on the right side.
 */
var SidebarItemView = View.extend({
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
    event.stopPropagation();
    event.preventDefault();

    // fill in the form with the clicked connection details
    // @todo need to fill the form with the stored values, use this.parent.form.setValues()
  },
  onDoubleClick: function(event) {
    this.onClick(event);
    this.parent.parent.onSubmit(event);
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
 * Renders all existing connections in the sidebar.
 */
module.exports = View.extend({
  template: require('./sidebar.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, SidebarItemView, this.queryByHook('connection-list'));
  }
});
