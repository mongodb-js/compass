var View = require('ampersand-view');
var CollectionStatsView = require('../collection-stats');
var FieldListView = require('../field-list');
var DocumentListView = require('../document-list');
var RefineBarView = require('../refine-view');
var MongoDBCollection = require('../models/mongodb-collection');
var SampledSchema = require('../models/sampled-schema');
var app = require('ampersand-app');
var $ = require('jquery');
var _ = require('lodash');
var debug = require('debug')('scout:home:collection');

require('bootstrap/js/modal');

var MongoDBCollectionView = View.extend({
  // modelType: 'Collection',
  template: require('./collection.jade'),
  props: {
    sidebar_open: {
      type: 'boolean',
      default: false
    },
    visible: {
      type: 'boolean',
      default: false
    }
  },
  derived: {
    is_empty: {
      deps: ['schema.sample_size', 'schema.is_fetching'],
      fn: function() {
        return this.schema.sample_size === 0 && !this.schema.is_fetching;
      }
    }
  },
  events: {
    'click .splitter': 'onSplitterClick'
  },
  bindings: {
    'model.name': {
      hook: 'name'
    },
    sidebar_open: {
      type: 'booleanClass',
      yes: 'sidebar-open',
      hook: 'column-container'
    },
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    },
    is_empty: [
      {
        hook: 'empty',
        type: 'booleanClass',
        no: 'hidden'
      },
      {
        hook: 'column-container',
        type: 'booleanClass',
        yes: 'hidden'
      }
    ]
  },
  children: {
    schema: SampledSchema
  },
  initialize: function() {
    this.model = new MongoDBCollection();
    app.statusbar.watch(this, this.schema);
    this.listenTo(this.schema, 'sync', this.schemaIsSynced.bind(this));
    this.listenTo(this.schema, 'request', this.schemaIsRequested.bind(this));
    this.listenToAndRun(this.parent, 'change:ns', this.onCollectionChanged.bind(this));
  },
  schemaIsSynced: function() {
    // only listen to share menu events if we have a sync'ed schema
    // @todo enable share menu item here
    this.listenTo(app, 'menu-share-schema-json', this.onShareSchema.bind(this));
  },
  schemaIsRequested: function() {
    // while a new schema is requested, don't let the user share via the menu option
    // @todo disable share menu item here
    this.stopListening(app, 'menu-share-schema-json');
  },
  onShareSchema: function() {
    var clipboard = window.require('clipboard');
    clipboard.writeText(JSON.stringify(this.schema.serialize(), null, '  '));
    $(this.queryByHook('share-schema-confirmation')).modal('show');
  },
  onCollectionChanged: function() {
    var ns = this.parent.ns;
    if (!ns) {
      this.visible = false;
      debug('No active collection namespace so no schema has been requested yet.');
      return;
    }
    this.visible = true;
    app.queryOptions.reset();
    app.volatileQueryOptions.reset();

    this.schema.ns = this.model._id = ns;
    debug('updating namespace to `%s`', ns);
    this.schema.reset();
    this.schema.fetch(_.assign({}, app.volatileQueryOptions.serialize(), {
      message: 'Analyzing documents...'
    }));
    this.model.fetch();
  },
  onQueryChanged: function() {
    var options = app.queryOptions.serialize();
    options.message = 'Analyzing documents...';
    this.schema.refine(options);
  },
  /**
   * handler for opening the document viewer sidebar.
   */
  onSplitterClick: function() {
    this.toggle('sidebar_open');
  },
  subviews: {
    stats: {
      hook: 'stats-subview',
      prepareView: function(el) {
        return new CollectionStatsView({
          el: el,
          parent: this,
          model: this.model
        });
      }
    },
    refine_bar: {
      hook: 'refine-bar',
      prepareView: function(el) {
        var refineBarView = new RefineBarView({
          el: el,
          parent: this,
          queryOptions: app.queryOptions,
          volatileQueryOptions: app.volatileQueryOptions
        });
        this.listenTo(refineBarView, 'submit', this.onQueryChanged);
        return refineBarView;
      }
    },
    fields: {
      hook: 'fields-subview',
      prepareView: function(el) {
        return new FieldListView({
          el: el,
          parent: this,
          collection: this.schema.fields
        });
      }
    },
    documents: {
      hook: 'documents-subview',
      prepareView: function(el) {
        return new DocumentListView({
          el: el,
          parent: this,
          collection: this.schema.documents
        });
      }
    }
  }
});

module.exports = MongoDBCollectionView;
