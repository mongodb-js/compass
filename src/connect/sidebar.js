var View = require('ampersand-view');
var Connection = require('../models/connection');
var debug = require('debug')('scout:connect:sidebar');
var FilteredCollection = require('ampersand-filtered-subcollection');

/**
 * View for a connection in the sidebar. It can be clicked (will copy details to the form view)
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
    dblclick: 'onDoubleClick'
  },
  bindings: {
    'model.name': {
      hook: 'name'
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
    // create a collection proxy that filters favorite collections and sorts alphabetically
    var favoriteConnections = new FilteredCollection(this.collection, {
      where: {
        is_favorite: true
      },
      comparator: function(model) {
        return model.name.toLowerCase();
      }
    });
    this.renderCollection(favoriteConnections, SidebarItemView,
      this.queryByHook('connection-list-favorites'));
    this.renderCollection(this.collection, SidebarItemView,
      this.queryByHook('connection-list-recent'));
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
