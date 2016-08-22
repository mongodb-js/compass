var View = require('ampersand-view');
var State = require('ampersand-state');

var _ = require('lodash');
var app = require('ampersand-app');
var ExplainPlanModel = require('mongodb-explain-plan-model');
var DocumentView = require('../documents/document-list-item');
var IndexDefinitionView = require('../indexes/index-definition');
var TreeView = require('./tree-view');
var StageModel = require('./stage-model');

var electron = require('electron');
var shell = electron.shell;

var debug = require('debug')('mongodb-compass:explain-plan');

var DocumentModel = State.extend({
  idAttribute: '_id',
  extraProperties: 'allow'
});

/**
 * View of the entire Explain Plan view
 */
module.exports = View.extend({
  template: require('./index.jade'),
  props: {
    explainPlan: 'state',
    ns: {
      type: 'string',
      default: ''
    },
    visible: {
      type: 'boolean',
      required: true,
      default: false
    },
    showExplainTree: {
      type: 'boolean',
      required: true,
      default: false
    },
    // refine bar for explain view
    hasRefineBar: ['boolean', true, true],
    activeDetailView: {
      type: 'string',
      default: 'tree',
      values: ['json', 'tree']
    }
  },
  session: {
    rawSubview: 'object',
    treeSubview: 'object',
    indexDefinitionSubview: 'object'
  },
  derived: {
    usedMultipleIndexes: {
      deps: ['explainPlan.usedIndex'],
      fn: function() {
        if (!this.explainPlan) {
          return false;
        }
        var usedIndex = this.explainPlan.usedIndex;
        return _.isArray(usedIndex);
      }
    },
    indexMessageType: {
      deps: ['explainPlan.isCovered', 'explainPlan.isCollectionScan', 'usedMultipleIndexes'],
      fn: function() {
        if (this.usedMultipleIndexes) {
          return 'MULTIPLE';
        }
        if (!this.explainPlan) {
          return 'UNAVAILABLE';
        }
        if (this.explainPlan.isCollectionScan) {
          return 'COLLSCAN';
        }
        if (this.explainPlan.isCovered) {
          return 'COVERED';
        }
        return 'INDEX';
      }
    },
    showWarningTriangle: {
      deps: ['indexMessageType'],
      fn: function() {
        return (this.indexMessageType === 'COLLSCAN' || this.indexMessageType === 'MULTIPLE');
      }
    },
    indexMessage: {
      deps: ['indexMessageType'],
      fn: function() {
        if (this.indexMessageType === 'COLLSCAN') {
          return 'No index available for this query.';
        }
        if (this.indexMessageType === 'COVERED') {
          return 'Query covered by index:';
        }
        if (this.indexMessageType === 'MULTIPLE') {
          return 'Shard results differ (see details below)';
        }
        return 'Query used the following index:';
      }
    },
    rawOutput: {
      deps: ['explainPlan.rawExplainObject'],
      fn: function() {
        if (!this.explainPlan) {
          return '';
        }
        return JSON.stringify(this.explainPlan.rawExplainObject, null, ' ');
      }
    },
    inMemorySort: {
      deps: ['explainPlan.inMemorySort'],
      fn: function() {
        if (!this.explainPlan) {
          return '';
        }
        return this.explainPlan.inMemorySort ? 'Yes' : 'No';
      }
    },
    showLinkToIndexes: {
      deps: ['explainPlan.isCollectionScan', 'usedMultipleIndexes'],
      fn: function() {
        if (!this.explainPlan) {
          return false;
        }
        return this.explainPlan.isCollectionScan && !this.usedMultipleIndexes;
      }
    }
  },
  events: {
    'click [data-hook=indexes-link]': 'indexLinkClicked',
    'click [data-hook=json-button]': 'jsonButtonClicked',
    'click [data-hook=tree-button]': 'treeButtonClicked',
    'click i.link': 'linkIconClicked'
  },
  bindings: {
    ns: {
      hook: 'ns'
    },
    showExplainTree: {
      type: 'toggle',
      hook: 'tree-button'
    },
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    },
    'explainPlan.usedIndex': {
      type: 'attribute',
      name: 'title',
      hook: 'index-definition-container'
    },
    activeDetailView: [
      {
        type: 'switch',
        cases: {
          'tree': '.tree-container',
          'json': '.json-container'
        }
      },
      {
        type: 'switchClass',
        name: 'active',
        cases: {
          'tree': '[data-hook=tree-button]',
          'json': '[data-hook=json-button]'
        }
      }
    ],
    'explainPlan.totalKeysExamined': {
      hook: 'total-keys-examined'
    },
    'explainPlan.totalDocsExamined': {
      hook: 'total-docs-examined'
    },
    'explainPlan.indexUsed': {
      hook: 'index-used'
    },
    'explainPlan.sortStage': {
      hook: 'sort-stage'
    },
    'showLinkToIndexes': {
      type: 'switch',
      cases: {
        true: '[data-hook=link-to-indexes-container]',
        false: '[data-hook=index-name-container]'
      }
    },
    'explainPlan.nReturned': {
      hook: 'n-returned'
    },
    'explainPlan.executionTimeMillis': {
      hook: 'execution-time-millis'
    },
    showWarningTriangle: {
      type: 'toggle',
      hook: 'index-message-icon'
    },
    indexMessage: {
      hook: 'index-message-text'
    },
    indexMessageType: [
      {
        type: 'switchAttribute',
        hook: 'index-message-text',
        name: 'style',
        cases: {
          'COLLSCAN': 'color: #7F6A4E;',
          'MULTIPLE': 'color: #7F6A4E;',
          'INDEX': 'color: #313030;',
          'COVERED': 'color: #507b32;'
        }
      }
    ],
    'inMemorySort': {
      hook: 'in-memory-sort'
    },
    rawOutput: {
      hook: 'raw-output'
    }
  },
  initialize: function() {
    this.listenTo(this.model, 'sync', this.onModelSynced.bind(this));
    this.listenTo(this.parent, 'submit:query', this.onQueryChanged.bind(this));
    this.on('change:visible', this.onVisibleChanged.bind(this));
    this.showExplainTree = app.isFeatureEnabled('showExplainPlanTab');
  },
  onModelSynced: function() {
    this.ns = this.model._id;
    this.fetchExplainPlan();
  },
  onQueryChanged: function() {
    this.fetchExplainPlan();
  },
  indexLinkClicked: function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.parent.switchView('indexView');
  },
  jsonButtonClicked: function() {
    this.activeDetailView = 'json';
  },
  treeButtonClicked: function() {
    this.activeDetailView = 'tree';
  },
  fetchExplainPlan: function() {
    var filter = app.queryOptions.query.serialize();
    var options = {};
    var view = this;

    app.dataService.explain(this.ns, filter, options, function(err, explain) {
      if (err) {
        return debug('error', err);
      }
      view.explainPlan = new ExplainPlanModel(explain);

      // remove old tree view
      if (view.treeSubview) {
        view.treeSubview.remove();
      }
      // render new tree view
      var stageModel = new StageModel(view.explainPlan.rawExplainObject.executionStats.executionStages, {
        parse: true
      });
      view.treeSubview = view.renderSubview(new TreeView({
        model: stageModel,
        parent: view
      }), '[data-hook=tree-subview]');

      // create new document model from raw explain output
      var rawDocModel = new DocumentModel(view.explainPlan.rawExplainObject);
      // remove old view if present
      if (view.rawSubview) {
        view.rawSubview.remove();
      }
      // render document model with a DocumentView
      view.rawSubview = view.renderSubview(new DocumentView({
        model: rawDocModel,
        parent: view
      }), '[data-hook=raw-subview]');
      // expand all top-level fields in the explain output
      var toplevel = 'li.document-list-item > ol > li.document-property.object,' +
        'li.document-list-item > ol > li.document-property.array';
      _.each(view.queryAll(toplevel), function(el) {
        el.classList.toggle('expanded');
      });

      // remove old index definition view first
      if (view.indexDefinitionSubview) {
        view.indexDefinitionSubview.remove();
      }

      // find index definition model and create view
      if (_.isString(view.explainPlan.usedIndex) && !this.usedMultipleIndexes) {
        var indexModel = view.model.indexes.get(view.explainPlan.usedIndex, 'name');

        view.indexDefinitionSubview = view.renderSubview(new IndexDefinitionView({
          model: indexModel,
          parent: view
        }), '[data-hook=index-definition-subview]');
      }
    });
  },
  onVisibleChanged: function() {
    if (this.visible) {
      this.parent.refineBarView.visible = this.hasRefineBar;
    }
  },
  linkIconClicked: function(event) {
    event.preventDefault();
    event.stopPropagation();

    // maps which info sprinkles go to which website
    var dataLink = event.target.dataset.link;
    var baseURL = 'https://docs.mongodb.com/manual/reference/explain-results/#explain.executionStats';
    var urlMap = {
      totalKeysExamined: baseURL + '.totalKeysExamined',
      totalDocsExamined: baseURL + '.totalDocsExamined',
      nReturned: baseURL + '.nReturned',
      executionTimeMillis: baseURL + '.executionTimeMillis',
      indexUsed: 'https://docs.mongodb.com/manual/reference/explain-results/#collection-scan-vs-index-use',
      sortStage: 'https://docs.mongodb.com/manual/reference/explain-results/#sort-stage'
    };
    var url = _.get(urlMap, dataLink, null);
    if (url) {
      shell.openExternal(url);
    }
  }
});
