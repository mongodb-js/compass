var View = require('ampersand-view');

/**
 * View for a connection in the sidebar. It can be clicked (will copy details to the form view)
 * or it can be deleted via the X on the right side.
 */
var SidebarItemView = View.extend({
  namespace: 'SidebarItemView',
  props: {
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
    'click [data-hook=close]': 'onRemoveClick'
  },
  bindings: {
    'model.name': {
      hook: 'name'
    },
    hover: {
      type: 'toggle',
      hook: 'close'
    },
    has_auth: {
      type: 'booleanClass',
      hook: 'has-auth',
      yes: 'visible',
      no: 'hidden'
    }
  },
  derived: {
    has_auth: {
      deps: ['model.authentication'],
      fn: function() {
        return this.model.authentication !== 'NONE';
      }
    }
  },
  template: require('./connection.jade'),
  onClick: function(event) {
    this.parent.onItemClick(event, this);
  },
  onDoubleClick: function(event) {
    this.parent.onItemDoubleClick(event, this);
  },
  onRemoveClick: function(event) {
    event.stopPropagation();
    event.preventDefault();
    this.model.destroy();
    this.parent.onRemoveClick(event, this);
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
  session: {
    active_item_view: {
      type: 'state'
    }
  },
  events: {
    'click a[data-hook=new-connection]': 'onNewConnectionClick'
  },
  namespace: 'SidebarView',
  template: require('./sidebar.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, SidebarItemView, this.queryByHook('connection-list'));
  },
  onNewConnectionClick: function(event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.active_item_view) {
      this.active_item_view.el.classList.remove('active');
      this.active_item_view = null;
    }
    this.parent.createNewConnection();
  },
  onRemoveClick: function(event, view) {
    event.stopPropagation();
    event.preventDefault();
    view.model.destroy();
    this.parent.onConnectionDestroyed();
  },
  onItemClick: function(event, view) {
    event.stopPropagation();
    event.preventDefault();
    if (this.active_item_view) {
      this.active_item_view.el.classList.remove('active');
    }

    this.active_item_view = view;
    this.active_item_view.el.classList.add('active');
    this.parent.onConnectionSelected(view.model);
  },
  onItemDoubleClick: function(event, view) {
    this.onItemClick(event, view);
    this.parent.connect(view.model);
  }
});

module.exports = SidebarView;
