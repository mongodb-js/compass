var SidebarView = require('../../sidebar');
var Collection = require('ampersand-collection');
var State = require('ampersand-state');
var FilteredCollection = require('ampersand-filtered-subcollection');
var SidebarItemView = require('./sidebar-item-view');
var NewConnectionWidget = require('./new-connection-widget');
var View = require('ampersand-view');

var debug = require('debug')('mongodb-compass:connect:sidebar');

var Section = State.extend({
  idAttribute: 'name',
  props: {
    name: 'string',
    icon: 'any',
    connections: 'any'
  }
});

var SectionCollection = Collection.extend({
  namespace: 'SectionCollection',
  model: Section
});

module.exports = View.extend({
  template: '<div data-hook="sidebar-subview"></div>',
  session: {
    activeItemView: {
      type: 'state',
      default: null,
      required: false
    },
    connections: 'any'
  },
  collections: {
    sections: SectionCollection
  },
  derived: {
    newConnectionActive: {
      deps: ['activeItemView'],
      fn: function() {
        return this.activeItemView === null;
      }
    }
  },
  subviews: {
    sidebar: {
      hook: 'sidebar-subview',
      // waitFor: 'sections',
      prepareView: function(el) {
        return new SidebarView({
          el: el,
          parent: this,
          icon: function(view) {
            return view.model.icon;
          },
          widgets: [{
            viewClass: NewConnectionWidget
          }],
          collection: this.sections,
          displayProp: 'name',
          nested: {
            icon: 'fa-fw',
            collectionName: 'connections',
            itemViewClass: SidebarItemView,
            displayProp: 'name'
          }
        }).on('show', this.onItemClick.bind(this));
      }
    }
  },
  render: function() {
    this.renderWithTemplate(this);
    if (this.connections.fetched) {
      this.onSynced();
    } else {
      this.connections.once('sync', this.onSynced.bind(this));
    }
  },
  onSynced: function() {
    var favoriteConnections = new FilteredCollection(this.connections, {
      where: {
        is_favorite: true
      },
      comparator: function(model) {
        return -model.last_used;
      }
    });
    var historyConnections = new FilteredCollection(this.connections, {
      where: {
        is_favorite: false
      },
      comparator: function(model) {
        return -model.last_used;
      }
    });

    this.sections.reset([
      // {
      //   name: 'New Connection',
      //   icon: ['fa-fw', 'fa-bolt']
      // },
      {
        name: 'Favorites',
        icon: ['fa-fw', 'fa-star'],
        connections: favoriteConnections
      },
      {
        name: 'Recent Connections',
        icon: ['fa-fw', 'fa-history'],
        connections: historyConnections
      }
    ]);
    // debug('favconn', favoriteConnections.serialize());
    //
    // var favoriteSection = new Section({
    //   name: 'Favorites',
    //   icon: 'fa-star',
    //   connections: favoriteConnections
    // });
    // this.sections.add(favoriteSection);

    // var historySection = new Section({
    //   name: 'Previous Connections',
    //   icon: 'fa-history',
    //   connections:
    // });
    // this.sections.add(historySection);
    // group by sections
    // this.sections.reset(
    //   _.map(this.collection.groupBy('is_favorite'), function(value, key) {
    //     debug('key', key, 'value', value)
    //     return {
    //       name: key === 'true' ? 'Favorites' : 'Recent Connections',
    //       connections: value
    //     };
    //   }), {
    //     parse: true
    //   }
    // );
    debug('this.sections', this.sections);
  },

  // events: {
  //   'click a[data-hook=new-connection]': 'onNewConnectionClicked'
  // },
  onNewConnectionClicked: function(event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.activeItemView) {
      this.activeItemView = null;
    }
    this.connections.deactivateAll();
    this.parent.createNewConnection();
  },
  onItemClick: function(model) {
    if (!this.connections.select(model)) {
      return debug('already selected %s', model);
    }
    this.parent.selectExistingConnection(model);
  }
  // onItemDoubleClick: function(view) {
  //   this.onItemClick(event, view);
  //   this.parent.validateConnection(view.model);
  // }
});
