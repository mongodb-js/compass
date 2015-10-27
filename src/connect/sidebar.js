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
    click: 'onClick',
    dblclick: 'onDoubleClick'
  },
  bindings: {
    'model.name': [
      {
        hook: 'name'
      },
      {
        type: 'attribute',
        hook: 'name',
        name: 'title'
      }
    ],
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
  onClick: function(evt) {
    this.parent.onItemClick(evt, this);
  },
  onDoubleClick: function(evt) {
    this.parent.onItemDoubleClick(evt, this);
  }
});


/**
 * Renders all existing connections as list in the sidebar.
 */
var SidebarView = View.extend({
  session: {
    activeItemView: {
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

    var historyConnections = new FilteredCollection(this.collection, {
      filter: function(model) {
        return Boolean(model.last_used);
      }
    });
    this.renderCollection(historyConnections, SidebarItemView,
      this.queryByHook('connection-list-recent'));
  },
  onNewConnectionClick: function(event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.activeItemView) {
      this.activeItemView.el.classList.remove('selected');
      this.activeItemView = null;
    }
    this.parent.createNewConnection();
  },
  // onRemoveClick: function(event, view) {
  //   event.stopPropagation();
  //   event.preventDefault();
  //   view.model.destroy();
  //   this.parent.onConnectionDestroyed();
  // },
  onItemClick: function(event, view) {
    event.stopPropagation();
    event.preventDefault();
    if (this.activeItemView) {
      this.activeItemView.el.classList.remove('selected');
    }
    this.activeItemView = view;
    this.activeItemView.el.classList.add('selected');
    this.parent.onConnectionSelected(view.model);
  },
  onItemDoubleClick: function(event, view) {
    this.onItemClick(event, view);
    this.parent.connect(view.model);
  }
});

module.exports = SidebarView;
