var View = require('ampersand-view');
var CollectionStatsView = require('../collection-stats');
var ViewSwitcher = require('ampersand-view-switcher');
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
    ns: 'string'
  },
  initialize: function() {
    this.model = new MongoDBCollection();
    this.listenToAndRun(this.parent, 'change:ns', this.onCollectionChanged.bind(this));
  },
  onCollectionChanged: function() {
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
  render: function() {
    this.renderWithTemplate(this);
    this.viewSwitcher = new ViewSwitcher(this.queryByHook('collection-view-body'), {
      view: new SchemaView({
        parent: this,
        model: this.model
      })
    });
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
    header: {
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
    indexes: {
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
