var View = require('ampersand-view');
var FastView = require('../fast-view');
var _ = require('lodash');

var mousetrap = require('mousetrap');
var CollectionFilterView = require('./collection-filter');

var CollectionListView = require('./collection-list');
var SidebarControlsView = require('./sidebar-controls');

function fast_filter_collection(collection, pattern) {
  var re = new RegExp(pattern || '.*');
  collection.filter(function(model) {
    return re.test(model.getId());
  });
}

var SidebarView = View.extend(FastView, {
  props: {
    open: {
      type: 'boolean',
      default: true
    }
  },
  bindings: {
    open: [{
      type: 'booleanClass',
      no: 'hidden'
    }, {
      type: function() {
        var content = document.querySelector('.content');
        if (!content) return;
        if (this.open) {
          content.classList.add('with-sidebar');
        } else {
          content.classList.remove('with-sidebar');
        }
      }
    }]
  },
  initialize: function() {
    mousetrap.bind('command+k', this.toggle.bind(this, 'open'));
  },
  template: require('./index.jade'),
  subviews: {
    collections_filter: {
      hook: 'collection-filter-subview',
      prepareView: function(el) {
        return new CollectionFilterView({
          el: el,
          parent: this
        });
      }
    },
    collections: {
      hook: 'collection-list-subview',
      prepareView: function(el) {
        var view = new CollectionListView({
          el: el,
          parent: this,
          collection: this.collection
        });
        return view;
      }
    },
    sidebar_control: {
      hook: 'sidebar-control-subview',
      prepareView: function(el) {
        return new SidebarControlsView({
          el: el
        });
      }
    }
  },
  filterCollections: function(pattern) {
    _.defer(fast_filter_collection, this.collection, pattern);
  },
  filterFields: function(pattern) {
    // @todo (imlucas): Fix this ugliness...
    var collection = this.parent.currentCollectionView.fieldListView.collection;
    _.defer(fast_filter_collection, collection, pattern);
  }
});

module.exports = SidebarView;
