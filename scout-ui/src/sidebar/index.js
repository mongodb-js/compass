var View = require('ampersand-view');
var debug = require('debug')('scout-ui:home');

var CollectionFilterView = View.extend({
  template: require('./collection-filter.jade'),
  props: {
    search: 'string'
  },
  initialize: function() {
    this.listenTo(this, 'change:search', this.applyFilter);
  },
  events: {
    'input [data-hook=search]': 'handleInputChanged'
  },
  render: function() {
    this.renderWithTemplate(this);
    this.cacheElements({
      'input': '[data-hook=search]'
    });
    this.input.addEventListener('input', this.handleInputChanged.bind(this), false);
  },
  handleInputChanged: function() {
    this.search = this.input.value.trim();
  },
  applyFilter: function() {
    this.parent.filterCollections(this.search);
  }
});

// @todo: Keyboard nav: up/down: change active item, right: -> show collection, left: -> hide collection
var CollectionListView = View.extend({
  template: '<ul class="list-group" data-hook="collections"></ul>',
  ItemView: View.extend({
    bindings: {
      'model._id': {
        hook: 'ns'
      },
      'model.selected': {
        type: 'booleanClass',
        name: 'active'
      }
    },
    events: {
      'click': '_onClick'
    },
    template: require('./collection-list-item.jade'),
    _onClick: function() {
      this.parent.show(this.model);
    }
  }),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, this.ItemView, this.queryByHook('collections'));
  },
  show: function(model) {
    this.parent.trigger('show', model);
  }
});


var SidebarControlView = CollectionFilterView.extend({
  template: require('./sidebar-controls.jade'),
  applyFilter: function() {
    this.parent.filterFields(this.search);
  }
});


module.exports = View.extend({
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
        var view = new SidebarControlView({
          el: el,
        });
        return view;
      }
    }
  },
  filterCollections: function(pattern) {
    var re = new RegExp((pattern || '.*'));
    this.collection.filter(function(model) {
      return re.test(model.getId());
    });
  },
  filterFields: function(pattern) {
    var re = new RegExp((pattern || '.*'));
    // get current field list view
    var fieldListView = this.parent.currentCollectionView.fieldListView;
    fieldListView.collection.filter(function(model) {
      return re.test(model.getId());
    });
  }
});
