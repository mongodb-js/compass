var View = require('ampersand-view');
var Action = require('hadron-action');
var CollectionStatsView = require('../collection-stats');
var DocumentView = require('../documents');
var SchemaView = require('../schema');
var IndexView = require('../indexes');
var IndexesNewView = require('../indexes-new');
var ExplainView = require('../explain-plan');
var MongoDBCollection = require('../models/mongodb-collection');
var React = require('react');
var ReactDOM = require('react-dom');
var NamespaceStore = require('hadron-reflux-store').NamespaceStore;
var _ = require('lodash');

var app = require('ampersand-app');
var metrics = require('mongodb-js-metrics')();
var debug = require('debug')('mongodb-compass:home:collection');

var collectionTemplate = require('./collection.jade');

// map tab label to correct view and switch views
var tabToViewMap = {
  'DOCUMENTS': 'documentView',
  'SCHEMA': 'schemaView',
  'EXPLAIN PLAN': 'explainView',
  'INDEXES': 'indexView',
  'INDEXES NEW': 'indexesNewView'
};

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
      values: ['documentView', 'schemaView', 'explainView', 'indexView', 'indexesNewView']
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
        'indexView': '[data-hook=index-tab]',
        'indexesNewView': '[data-hook=indexes-new-tab]'
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
      waitFor: 'ns',
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
    indexesNewView: {
      hook: 'indexes-new-subview',
      waitFor: 'ns',
      prepareView: function(el) {
        return new IndexesNewView({
          el: el,
          parent: this,
          model: this.model
        });
      }
    }
  },
  initialize: function() {
    this.model = new MongoDBCollection();
    NamespaceStore.listen(this.onCollectionChanged.bind(this));
    this.loadIndexesAction = app.appRegistry.getAction('Action::Indexes::LoadIndexes');
    this.schemaActions = app.appRegistry.getAction('SchemaAction');
    // this.listenToAndRun(this.parent, 'change:ns', this.onCollectionChanged.bind(this));
  },
  render: function() {
    this.renderWithTemplate(this);
    // render query bar here for now
    var queryBarComponent = app.appRegistry.getComponent('App:QueryBar');
    ReactDOM.render(React.createElement(queryBarComponent), this.queryByHook('refine-bar-subview'));
  },
  onTabClicked: function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.switchView(tabToViewMap[e.target.innerText]);
  },
  switchView: function(viewStr) {
    debug('switching to', viewStr);
    // disable all views but the active one
    this.activeView = viewStr;
    _.each(_.values(tabToViewMap), function(subview) {
      if (!this[subview]) return;
      if (subview === viewStr) {
        this[viewStr].el.classList.remove('hidden');
      } else {
        this[subview].el.classList.add('hidden');
      }
    }.bind(this));
    // Temporary hack to generate a resize when the schema is clicked.
    if (viewStr === 'schemaView') {
      this.schemaActions.resizeMiniCharts();
    }
  },
  onCollectionChanged: function() {
    this.ns = NamespaceStore.ns;
    if (!this.ns) {
      this.visible = false;
      debug('No active collection namespace so no schema has been requested yet.');
      return;
    }
    this.visible = true;
    this.model._id = this.ns;
    this.model.once('sync', this.onCollectionFetched.bind(this));
    this.model.fetch();
    Action.filterChanged(app.queryOptions.query.serialize());
  },
  onCollectionFetched: function(model) {
    this.switchView(this.activeView);
    // track collection information
    var metadata = _.omit(model.serialize(), ['_id', 'database',
      'index_details', 'wired_tiger']);
    metadata.specialish = model.specialish;
    metadata['database name length'] = model.database.length;
    metadata['collection name length'] = model.getId().length -
      model.database.length - 1;
    metrics.track('Collection', 'fetched', metadata);
    this.loadIndexesAction();
  }
});

module.exports = MongoDBCollectionView;
