var View = require('ampersand-view');
var CollectionStatsView = require('../collection-stats');
var SchemaView = require('./schema');
var IndexView = require('../indexes');
var MongoDBCollection = require('../models/mongodb-collection');
var _ = require('lodash');

var metrics = require('mongodb-js-metrics')();
var debug = require('debug')('mongodb-compass:home:collection');

var collectionTemplate = require('../templates').home.collection;

var MongoDBCollectionView = View.extend({
  // modelType: 'Collection',
  template: collectionTemplate,
  props: {
    viewSwitcher: 'object',
    activeView: {
      type: 'string',
      required: true,
      default: 'schema',
      values: ['documents', 'indexes']
    },
    ns: 'string'
  },
  initialize: function() {
    this.model = new MongoDBCollection();
    this.listenToAndRun(this.parent, 'change:ns', this.onCollectionChanged.bind(this));
  },
  onCollectionChanged: function() {
    this.activeView = 'documents';
    if (this.indexView) {
      this.indexView.visible = false;
    }
    if (this.documentsView) {
      this.documentsView.visible = true;
    }
    if (this.statsView) {
      this.statsView.activeStats = 'documents';
    }
    this.ns = this.parent.ns;
    if (!this.ns) {
      this.visible = false;
      debug('No active collection namespace so no schema has been requested yet.');
      return;
    }
    this.model._id = this.ns;
    this.model.once('sync', this.onCollectionFetched.bind(this));
    this.model.fetch();
  },
  switchViews: function(view) {
    if (view === 'indexes') {
      this.documentsView.visible = false;
      this.indexView.visible = true;
    } else {
      this.indexView.visible = false;
      this.documentsView.visible = true;
    }
    this.activeView = view;
  },
  onCollectionFetched: function(model) {
    // track collection information
    var metadata = _.omit(model.serialize(), ['_id', 'database',
      'index_details', 'wired_tiger']);
    metadata.specialish = model.specialish;
    metadata['database name length'] = model.database.length;
    metadata['collection name length'] = model.getId().length -
      model.database.length - 1;
    metrics.track('Collection', 'fetched', metadata);
  },
  bindings: {
    'model._id': {
      hook: 'name'
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
    documentsView: {
      hook: 'schema-subview',
      waitFor: 'ns',
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
      waitFor: 'ns',
      prepareView: function(el) {
        return new IndexView({
          el: el,
          parent: this,
          model: this.model
        });
      }
    }
  }
});

module.exports = MongoDBCollectionView;
