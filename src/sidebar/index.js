var View = require('ampersand-view');
var mousetrap = require('mousetrap');
var InstancePropertiesView = require('./instance-properties');
var CollectionFilterView = require('./collection-filter');
var CollectionListView = require('./collection-list');
var app = require('ampersand-app');

var SidebarView = View.extend({
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
        if (!content) {
          return;
        }
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
    instance_properties: {
      hook: 'instance-properties-subview',
      prepareView: function(el) {
        return new InstancePropertiesView({
          el: el,
          parent: this,
          instance: app.instance
        });
      }
    },
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
    }
  },
  filterCollections: function(pattern) {
    var re = new RegExp(pattern);

    this.collection.filter(function(model) {
      return re.test(model.getId());
    });
  }
});

module.exports = SidebarView;
