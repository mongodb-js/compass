var View = require('ampersand-view');
// var Action = require('hadron-action');
var MongoDBCollection = require('../models/mongodb-collection');
var React = require('react');
var ReactDOM = require('react-dom');
var NamespaceStore = require('hadron-reflux-store').NamespaceStore;
var toNS = require('mongodb-ns');
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
  'VALIDATION': 'validationView'
};

/**
 * Ampersand view wrapper around a React component tab view
 */
var TabView = View.extend({
  template: '<div></div>',
  props: {
    componentKey: 'string',
    visible: {
      type: 'boolean',
      required: true,
      default: false
    }
  },
  bindings: {
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  render: function() {
    this.renderWithTemplate();
    var tabComponent = app.appRegistry.getComponent(this.componentKey);
    ReactDOM.render(React.createElement(tabComponent), this.query());
  }
});


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
      values: ['documentView', 'schemaView', 'explainView', 'indexView', 'validationView']
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
        'validationView': '[data-hook=validation-tab]'
      }
    }
  },
  subviews: {
    statsView: {
      hook: 'stats-subview',
      waitFor: 'ns',
      prepareView: function(el) {
        return new TabView({
          el: el,
          parent: this,
          visible: true,
          componentKey: 'CollectionStats.CollectionStats'
        });
      }
    },
    documentView: {
      hook: 'document-subview',
      waitFor: 'ns',
      prepareView: function(el) {
        return new TabView({
          el: el,
          parent: this,
          componentKey: 'CRUD.DocumentList'
        });
      }
    },
    schemaView: {
      hook: 'schema-subview',
      waitFor: 'ns',
      prepareView: function(el) {
        return new TabView({
          el: el,
          parent: this,
          componentKey: 'Schema.Schema'
        });
      }
    },
    indexView: {
      hook: 'index-subview',
      waitFor: 'ns',
      prepareView: function(el) {
        return new TabView({
          el: el,
          parent: this,
          componentKey: 'Indexes.Indexes'
        });
      }
    },
    explainView: {
      hook: 'explain-subview',
      waitFor: 'ns',
      prepareView: function(el) {
        return new TabView({
          el: el,
          parent: this,
          componentKey: 'Explain.ExplainPlan'
        });
      }
    },
    validationView: {
      hook: 'validation-subview',
      waitFor: 'ns',
      prepareView: function(el) {
        return new TabView({
          el: el,
          parent: this,
          componentKey: 'Validation.Validation'
        });
      }
    }
  },
  initialize: function() {
    this.model = new MongoDBCollection();
    NamespaceStore.listen(this.onCollectionChanged.bind(this));
    this.loadIndexesAction = app.appRegistry.getAction('Indexes.LoadIndexes');
    this.fetchExplainPlanAction = app.appRegistry.getAction('Explain.Actions').fetchExplainPlan;
    this.schemaActions = app.appRegistry.getAction('Schema.Actions');
    this.validationActions = app.appRegistry.getAction('Validation.Actions');
    // this.listenToAndRun(this.parent, 'change:ns', this.onCollectionChanged.bind(this));
  },
  render: function() {
    this.renderWithTemplate(this);
    // render query bar here for now
    // var queryBarComponent = app.appRegistry.getComponent('Query.QueryBar');
    // ReactDOM.render(React.createElement(queryBarComponent), this.queryByHook('refine-bar-subview'));
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
  onCollectionChanged: function(ns) {
    if (ns === this.ns) {
      return;
    }
    this.ns = ns;
    if (!ns || !toNS(ns || '').collection) {
      this.visible = false;
      debug('No active collection namespace so no schema has been requested yet.');
      return;
    }
    this.visible = true;
    this.model._id = this.ns;
    // this.model.once('sync', this.onCollectionFetched.bind(this));
    // this.model.fetch();
    // Action.filterChanged.listen(() => {
    //   this.loadIndexesAction();
    //   this.fetchExplainPlanAction();
    // });
    // Action.filterChanged(app.queryOptions.query.serialize());
    this.switchView(this.activeView);
  },
  onCollectionFetched: function(model) {
    // track collection information
    // @todo: Durran: We need to move these metrics into the namespace store
    //   or the collection store as this is no longer called.
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
