var AmpersandView = require('ampersand-view');
var ViewSwitcher = require('ampersand-view-switcher');
var models = require('../models');
var debug = require('debug')('scout-ui:home');
var app = require('ampersand-app');
var format = require('util').format;
var SidebarView = require('../sidebar');
var FieldListView = require('../field-list');
var RefineBarView = require('../refine-view');

require('bootstrap/js/dropdown');
require('bootstrap/js/collapse');

var CollectionView = AmpersandView.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    }
  },
  children: {
    model: models.Collection,
    schema: models.SampledSchema
  },
  initialize: function() {
    app.statusbar.watch(this, this.schema);

    this.schema.ns = this.model._id;
    this.listenTo(this.schema, 'error', this.onError);
    this.listenTo(app.queryOptions, 'change:query', this.onRefine);
    this.schema.fetch(app.queryOptions.serialize());
  },
  template: require('./collection.jade'),
  onError: function(schema, err) {
    // @todo: Figure out a good way to handle this (server is probably crashed).
    console.error('Error getting schema: ', err);
  },
  onRefine: function(evt) {
    debug('sample refined, query is now:', JSON.stringify(app.queryOptions.serialize()));
    this.schema.fetch(app.queryOptions.serialize());
  },
  subviews: {
    refinebar: {
      hook: 'refine-bar',
      prepareView: function(el) {
        return new RefineBarView({
          el: el,
          parent: this,
          model: app.queryOptions
        });
      }
    },
    fields: {
      waitFor: 'schema.fields',
      hook: 'fields-container',
      prepareView: function(el) {
        return new FieldListView({
          el: el,
          parent: this,
          collection: this.schema.fields
        });
      }
    }
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
    this.ns = options.ns;

    app.statusbar.watch(this, this.model);

    this.listenTo(this.model, 'sync', function() {
      if (!this.ns) return;

      var current = this.model.collections.find({
        _id: this.ns
      });
      if (!current) return;

      this.showCollection(current);
    });

    this.once('change:rendered', this.onRendered);
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
  template: require('./index.jade'),
  subviews: {
    sidebar: {
      hook: 'sidebar',
      waitFor: 'model.collections',
      prepareView: function(el) {
        var view = new SidebarView({
          el: el,
          parent: this,
          collection: this.model.collections
        });
        view.on('show', this.showCollection.bind(this));
        return view;
      }
    }
  }
});
