var View = require('ampersand-view');
// var numeral = require('numeral');
// var _ = require('lodash');
// var semver = require('semver');
var app = require('ampersand-app');
var ExplainPlanModel = require('mongodb-explain-plan-model');

var debug = require('debug')('mongodb-compass:explain-plan');

/**
 * View of the entire Indexes Table
 */
module.exports = View.extend({
  template: require('./index.jade'),
  props: {
    ns: {
      type: 'string',
      default: ''
    },
    visible: {
      type: 'boolean',
      required: true,
      default: false
    },
    // refine bar for explain view
    hasRefineBar: ['boolean', true, true]
  },
  derived: {
    indexMessage: {
      deps: ['explainPlan.isCovered', 'explainPlan.isCollectionScan'],
      fn: function() {
        if (this.explainPlan.isCollectionScan) {
          return 'No index available for this query.';
        }
        if (this.explainPlan.isCovered) {
          return 'Query covered by index:';
        }
        return 'Query used the following index:';
      }
    },
    rawOutput: {
      deps: ['explainPlan.rawExplainObject'],
      fn: function() {
        return JSON.stringify(this.explainPlan.rawExplainObject, null, ' ');
      }
    },
    inMemorySort: {
      deps: ['explainPlan.inMemorySort'],
      fn: function() {
        return this.explainPlan.inMemorySort ? 'Yes' : 'No';
      }
    }
  },
  bindings: {
    ns: {
      hook: 'ns'
    },
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    },
    'explainPlan.usedIndex': {
      hook: 'index-name'
    },
    'explainPlan.totalKeysExamined': {
      hook: 'total-keys-examined'
    },
    'explainPlan.totalDocsExamined': {
      hook: 'total-docs-examined'
    },
    'explainPlan.nReturned': {
      hook: 'n-returned'
    },
    'explainPlan.executionTimeMillis': {
      hook: 'execution-time-millis'
    },
    indexMessage: {
      hook: 'index-message'
    },
    'inMemorySort': {
      hook: 'in-memory-sort'
    },
    rawOutput: {
      hook: 'raw-output'
    }
  },
  children: {
    explainPlan: ExplainPlanModel
  },
  events: {
  },
  initialize: function() {
    this.listenTo(this.model, 'sync', this.onModelSynced.bind(this));
    this.listenTo(this.parent, 'submit:query', this.onQueryChanged.bind(this));
    this.on('change:visible', this.onVisibleChanged.bind(this));
  },
  onModelSynced: function() {
    this.ns = this.model._id;
    this.fetchExplainPlan();
  },
  onQueryChanged: function() {
    this.fetchExplainPlan();
  },
  fetchExplainPlan: function() {
    var filter = app.queryOptions.query.serialize();
    var options = {};
    var view = this;

    app.dataService.explain(this.ns, filter, options, function(err, explain) {
      if (err) {
        return debug('error', err);
      }
      view.explainPlan.set(view.explainPlan.parse(explain));
    });
  },
  onVisibleChanged: function() {
    if (this.visible) {
      this.parent.refineBarView.visible = this.hasRefineBar;
    }
  },
  render: function() {
    this.renderWithTemplate(this);
  }
});
