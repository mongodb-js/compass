var View = require('ampersand-view');
// var debug = require('debug')('scout:connect:sidebar');
var FilteredCollection = require('ampersand-filtered-subcollection');

/**
 * View for a connection in the sidebar. It can be clicked (will copy details to the form view)
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
    'model.active': {
      type: 'booleanClass',
      hook: 'a-connection-tag',
      name: 'selected'
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
      type: 'state',
      default: null
    }
  },
  derived: {
    newConnectionActive: {
      deps: ['activeItemView'],
      fn: function() {
        return this.activeItemView === null;
      }
    }
  },
  events: {
    'click a[data-hook=new-connection]': 'onNewConnectionClicked'
  },
  bindings: {
    newConnectionActive: {
      type: 'booleanClass',
      hook: 'panel-title-out',
      name: 'selected'
    }
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
      },
      comparator: function(model) {
        return -model.last_used;
      }
    });
    this.renderCollection(historyConnections, SidebarItemView,
      this.queryByHook('connection-list-recent'));
  },
  onNewConnectionClicked: function(event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.activeItemView) {
      this.activeItemView = null;
    }
    this.collection.deactivateAll();
    this.parent.createNewConnection();
  },
  onItemClick: function(event, view) {
    event.stopPropagation();
    event.preventDefault();
    this.activeItemView = view;
    this.parent.selectExistingConnection(view.model);
  },
  onItemDoubleClick: function(event, view) {
    this.onItemClick(event, view);
    this.parent.useConnection(view.model);
  }
});

module.exports = SidebarView;
