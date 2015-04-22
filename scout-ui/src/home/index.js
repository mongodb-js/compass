var AmpersandView = require('ampersand-view');
var $ = require('jquery');
var flatnest = require('flatnest');
var ViewSwitcher = require('ampersand-view-switcher');
var models = require('../models');
var debug = require('debug')('scout-ui:home');
var app = require('ampersand-app');
var _ = require('underscore');

var CollectionView = AmpersandView.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    }
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
      hook: 'name'
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
    this.$search = $(this.queryByHook('search'));
    this.$search.on('keyup', function() {
      this.search = this.$search.val();
      debug('search is now: %s', this.search);
    }.bind(this));
  },
  applyFilter: function() {
    var re;
    if (!this.search || this.search.length === 0) {
      re = new RegExp('.*');
    } else {
      re = new RegExp(this.search);
    }
    debug('search regex is now', re);
    this.parent.model.collections.filter(function(model) {
      return re.test(model._id);
    }.bind(this));
  }
});

// Keyboard nav:
// up/down: navigate list
// right: -> show collection
// left: -> hide collection
var CollectionsList = AmpersandView.extend({
  template: '<ul class="list-group" data-hook="collections-list"></ul>',
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, CollectionsListItem, this.queryByHook('collections-list'));
  },
  show: function(model) {
    if (model.selected) {
      return debug('already selected %s', model);
    }
    var current = this.collection.find({
      selected: true
    });
    if (current) current.toggle('selected');

    model.toggle('selected');
    model.documents.ns = model._id;

    document.title = 'mongodb://' + this.parent.model._id + '/' + model._id;

    this.parent.switcher.set(new CollectionView({
      model: model
    }));
    app.url('schema/' + model._id);
    // model.documents.fetch();
  }
});

module.exports = AmpersandView.extend({
  children: {
    model: models.Instance
  },
  initialize: function(options) {
    options = options || {};

    app.statusbar.watch(this, this.model);

    this.listenTo(this.model, 'sync', function() {
      if (!options.ns) return;

      var current = this.model.collections.find({
        _id: options.ns
      });
      if (!current) return;

      this.collections.show(current);
    });
    this.model.fetch();

    this.listenTo(this, 'change:rendered', function() {
      this.switcher = new ViewSwitcher(this.queryByHook('collection-container'), {
        show: function() {}
      });
    }.bind(this));
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
        return new CollectionsList({
          el: el,
          parent: this,
          collection: this.model.collections
        });
      }
    }
  }
});
