var AmpersandView = require('ampersand-view');
var $ = require('jquery');
var flatnest = require('flatnest');
var ViewSwitcher = require('ampersand-view-switcher');
var models = require('../models');
var debug = require('debug')('scout-ui:home');
var app = require('ampersand-app');
var format = require('util').format;

var CollectionView = AmpersandView.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    }
  },
  children: {
    model: models.Collection
  },
  template: require('./collection.jade'),
  render: function() {
    this.renderWithTemplate();
    this.listenTo(this.model.documents, 'sync reset', function() {
      $(this.el).find('[data-hook=sample]').html(JSON.stringify(this.model.documents.toJSON().map(function(d) {
        return flatnest.flatten(d);
      }), null, 2).replace(/\n/g, '<br />'));
    });
  }
});

var CollectionsListItem = AmpersandView.extend({
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
});

var ListFilter = AmpersandView.extend({
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

// @todo: Keyboard nav:
// up/down: change active item
// right: -> show collection
// left: -> hide collection
var CollectionsList = AmpersandView.extend({
  template: '<ul class="list-group" data-hook="collections-list"></ul>',
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, CollectionsListItem, this.queryByHook('collections-list'));
  },
  show: function(model) {
    this.trigger('show', model);
  }
});

module.exports = AmpersandView.extend({
  children: {
    model: models.Instance
  },
  props: {
    ns: {
      type: 'string',
      allowNull: true,
      default: null
    }
  },
  initialize: function(options) {
    options = options || {};
    this.ns = options.js;

    app.statusbar.watch(this, this.model);

    this.listenTo(this.model, 'sync', function() {
      if (!this.ns) return;

      var current = this.model.collections.find({
        _id: this.ns
      });
      if (!current) return;

      this.collections.show(current);
    });

    this.listenTo(this, 'change:rendered', this.onRendered);
    this.model.fetch();
  },
  onRendered: function() {
    this.switcher = new ViewSwitcher(this.queryByHook('collection-container'), {
      show: function() {}
    });
  },
  showCollection: function(model) {
    if (!this.model.collections.select(model)) {
      return debug('already selected %s', model);
    }

    this.switcher.set(new CollectionView({
      model: model
    }));

    app.url(format('schema/%s', model.getId()));
    document.title = format('mongodb://%s/%s', this.model.getId(), model.getId());
  },
  filter: function(pattern) {
    var re = new RegExp((pattern || '.*'));
    this.model.collections.filter(function(model) {
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
          collection: this.model.collections
        });
        this.listenTo(view, 'show', this.showCollection);
        return view;
      }
    }
  }
});
