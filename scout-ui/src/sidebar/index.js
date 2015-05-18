var View = require('ampersand-view');
var debug = require('debug')('scout-ui:home');
var models = require('../models');

var ListFilter = View.extend({
  props: {
    search: 'string'
  },
  initialize: function() {
    this.listenTo(this, 'change:search', this.applyFilter);
  },
  template: require('./list-filter.jade'),
  render: function() {
    this.renderWithTemplate(this);
    this.input = this.queryByHook('search');
    this.input.addEventListener('input', this.handleInputChanged.bind(this), false);
  },
  handleInputChanged: function() {
    this.search = this.input.value.trim();
  },
  applyFilter: function() {
    debug('search is now', this.search);
    this.parent.filter(this.search);
  }
});

// @todo: Keyboard nav: up/down: change active item, right: -> show collection, left: -> hide collection
var CollectionsList = View.extend({
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

module.exports = View.extend({
// collections: {
//   collection: models.CollectionCollection,
// },
  filter: function(pattern) {
    var re = new RegExp((pattern || '.*'));
    this.collection.filter(function(model) {
      return re.test(model.getId());
    });
  },
  template: require('./index.jade'),
  subviews: {
    collections_filter: {
      hook: 'collections-filter',
      prepareView: function(el) {
        return new ListFilter({
            el: el,
            parent: this
          });
      }
    },
    collections: {
      hook: 'collections',
      prepareView: function(el) {
        var view = new CollectionsList({
          el: el,
          parent: this,
          collection: this.collection
        });
        return view;
      }
    }
  }
});
