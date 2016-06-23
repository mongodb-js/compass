var View = require('ampersand-view');
var CollectionStatsView = require('../collection-stats');
var DocumentView = require('../documents');
var SchemaView = require('../schema');
var IndexView = require('../indexes');
var RefineBarView = require('../refine-view');
var ExplainView = require('../explain-plan');
var MongoDBCollection = require('../models/mongodb-collection');
var NamespaceStore = require('hadron-reflux-store').NamespaceStore;
var _ = require('lodash');

var app = require('ampersand-app');
var metrics = require('mongodb-js-metrics')();
var debug = require('debug')('mongodb-compass:home:collection');

var collectionTemplate = require('./collection.jade');

var MongoDBCollectionView = View.extend({
  // modelType: 'Collection',
  template: collectionTemplate,
  props: {
    visible: {
      type: 'boolean',
      default: false
    },
    viewSwitcher: 'object',
    activeView: {
      type: 'string',
      required: true,
      default: 'schemaView',
      values: ['documentView', 'schemaView', 'explainView', 'indexView']
    },
    ns: 'string'
  },
  events: {
    'click ul.nav li a': 'onTabClicked'
  },
  bindings: {
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    },
    'model._id': {
      hook: 'collection-name'
    },
    activeView: {
      type: 'switchClass',
      'name': 'active',
      cases: {
        'documentView': '[data-hook=document-tab]',
        'schemaView': '[data-hook=schema-tab]',
        'explainView': '[data-hook=explain-tab]',
        'indexView': '[data-hook=index-tab]'
      }
    }
  },
  subviews: {
    statsView: {
      hook: 'stats-subview',
      waitFor: 'ns',
      prepareView: function(el) {
        return new CollectionStatsView({
          el: el,
          parent: this,
          model: this.model
        });
      }
    },
    documentView: {
      hook: 'document-subview',
      prepareView: function(el) {
        return new DocumentView({
          el: el,
          parent: this,
          model: this.model
        });
      }
    },
    schemaView: {
      hook: 'schema-subview',
      prepareView: function(el) {
        return new SchemaView({
          el: el,
          parent: this,
          model: this.model
        });
      }
    },
    indexView: {
      hook: 'index-subview',
      prepareView: function(el) {
        return new IndexView({
          el: el,
          parent: this,
          model: this.model
        });
      }
    },
    explainView: {
      hook: 'explain-subview',
      prepareView: function(el) {
        return new ExplainView({
          el: el,
          parent: this,
          model: this.model
        });
      }
    },
    refineBarView: {
      hook: 'refine-bar-subview',
      prepareView: function(el) {
        var view = new RefineBarView({
          el: el,
          parent: this,
          queryOptions: app.queryOptions,
          volatileQueryOptions: app.volatileQueryOptions
        });
        view.on('submit', function() {
          this.trigger('submit:query');
        }.bind(this));
        return view;
      }
    }
  },
  initialize: function() {
    this.model = new MongoDBCollection();
    this.listenToAndRun(this.parent, 'change:ns', this.onCollectionChanged.bind(this));
  },
  onTabClicked: function(e) {
    e.preventDefault();
    e.stopPropagation();

    // map tab label to correct view and switch views
    var tabToViewMap = {
      'DOCUMENTS': 'documentView',
      'SCHEMA': 'schemaView',
      'EXPLAIN PLAN': 'explainView',
      'INDEXES': 'indexView'
    };
    this.switchView(tabToViewMap[e.target.innerText]);
  },
  switchView: function(viewStr) {
    // disable all views but the active one
    _.each(this._subviews, function(subview) {
      subview.visible = false;
    });
    if (this[viewStr]) {
      this[viewStr].visible = true;
    }
    this.activeView = viewStr;
  },
  onCollectionChanged: function() {
    this.ns = this.parent.ns;
    if (!this.ns) {
      this.visible = false;
      debug('No active collection namespace so no schema has been requested yet.');
      return;
    }
    this.visible = true;
    this.model._id = this.ns;
    // Need to keep the global state in sync.
    NamespaceStore.ns = this.ns;
    this.model.once('sync', this.onCollectionFetched.bind(this));
    this.model.fetch();
  },
  onCollectionFetched: function(model) {
    if (app.isFeatureEnabled('treasureHunt')) {
      if (model.getId() === 'news.news') {
        metrics.track('Treasure Hunt', 'stage3', {
          achievement: 'found the Atlas of Origins.',
          time: new Date()
        });
      }
    }
    this.switchView(this.activeView);
    // track collection information
    var metadata = _.omit(model.serialize(), ['_id', 'database',
      'index_details', 'wired_tiger']);
    metadata.specialish = model.specialish;
    metadata['database name length'] = model.database.length;
    metadata['collection name length'] = model.getId().length -
      model.database.length - 1;
    metrics.track('Collection', 'fetched', metadata);
  }
});

module.exports = MongoDBCollectionView;
