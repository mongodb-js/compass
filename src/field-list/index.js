var View = require('ampersand-view');
var TypeListView = require('./type-list');
var MinichartView = require('../minicharts');
var ViewSwitcher = require('ampersand-view-switcher');
var $ = require('jquery');
var debug = require('debug')('scout:field-list');
var _ = require('lodash');
var raf = require('raf');
var SampledSchema = require('../models/sampled-schema');
var app = require('ampersand-app');

var LeafClause = require('mongodb-language-model').LeafClause;
var Query = require('mongodb-language-model').Query;

function handleCaret(el) {
  var $el = $(el);
  // only apply to own caret, not children carets
  if ($el.next().text() !== this.model.name) return;
  if (this.model.fields || this.model.arrayFields) {
    $el.addClass('caret');
  } else {
    $el.removeClass('caret');
  }
}

var FieldListView;

var FieldView = View.extend({
  modelType: 'FieldView',
  session: {
    expanded: {
      type: 'boolean',
      default: false
    },
    type_model: 'state',
    visible: {
      type: 'boolean',
      default: false
    },
    minichartView: 'view',
    fieldListView: 'view',
    arrayFieldListView: 'view'
  },
  children: {
    refineClause: LeafClause
  },
  bindings: {
    'model.name': {
      hook: 'name'
    },
    'model.fields': {
      type: handleCaret,
      hook: 'caret'
    },
    'model.arrayFields': {
      type: handleCaret,
      hook: 'caret'
    },
    expanded: {
      type: 'booleanClass',
      yes: 'expanded',
      no: 'collapsed'
    },
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  events: {
    'click .schema-field-name': 'click'
  },
  template: require('./field.jade'),
  subviews: {
    types: {
      hook: 'types-subview',
      waitFor: 'visible',
      prepareView: function(el) {
        return new TypeListView({
          el: el,
          parent: this,
          collection: this.model.types
        });
      }
    },
    fields: {
      hook: 'fields-subview',
      waitFor: 'model.fields',
      prepareView: function(el) {
        this.set('fieldListView', new FieldListView({
          el: el,
          parent: this,
          collection: this.model.fields
        }), { silent: true });
        this.listenTo(this.fieldListView, 'change:refineQuery', this.onRefineClause);
        return this.fieldListView;
      }
    },
    arrayFields: {
      hook: 'arrayfields-subview',
      waitFor: 'model.arrayFields',
      prepareView: function(el) {
        this.set('arrayFieldListView', new FieldListView({
          el: el,
          parent: this,
          collection: this.model.arrayFields
        }), { silent: true });
        this.listenTo(this.arrayFieldListView, 'change:refineQuery', this.onRefineClause);
        return this.arrayFieldListView;
      }
    }
  },
  initialize: function() {
    this.listenTo(this, 'change:visible', this.renderMinicharts);
    this.refineClause.key.content = this.model.name;
  },
  render: function() {
    this.renderWithTemplate(this);
    this.viewSwitcher = new ViewSwitcher(this.queryByHook('minichart-container'));
  },
  onRefineClause: function(who, what) {
    if (who.getType() === 'MinichartView') {
      this.refineClause.value = who.refineValue;
    }
    this.parent.trigger('refine', this);
  },
  prefixClauseKey: function(clause) {
    var newClause = new LeafClause();
    newClause.key.content = this.model.name + '.' + clause.key.buffer;
    newClause.value = clause.value;
    return newClause;
  },
  getClauses: function() {
    var clauses = [];
    if (this.fieldListView) {
      this.fieldListView.refineQuery.clauses.each(function(clause) {
        if (clause.valid) clauses.push(this.prefixClauseKey(clause));
      }.bind(this));
    }
    if (this.arrayFieldListView) {
      this.arrayFieldListView.refineQuery.clauses.each(function(clause) {
        if (clause.valid) clauses.push(this.prefixClauseKey(clause));
      }.bind(this));
    }
    if (this.refineClause.valid) {
      clauses.push(this.refineClause);
    }
    return clauses;
  },
  renderMinicharts: function() {
    if (!this.type_model) {
      this.type_model = this.model.types.at(0);
    }

    debug('setting miniview for type_model_id `%s`', this.type_model.getId());
    this.minichartView = new MinichartView({
      model: this.type_model,
      parent: this
    });
    this.refineClause.value = this.minichartView.refineValue;
    this.listenTo(this.minichartView, 'change:refineValue', this.onRefineClause);
    this.viewSwitcher.set(this.minichartView);
  },
  click: function(evt) {
    this.toggle('expanded');
    evt.preventDefault();
    evt.stopPropagation();
  }
});

FieldListView = View.extend({
  modelType: 'FieldListView',
  session: {
    fieldCollectionView: 'view',
    refineQuery: {
      type: 'state',
      required: true,
      default: function() { return new Query(); }
    },
    queryContext: 'object'
  },
  template: require('./index.jade'),
  initialize: function() {
    if (this.collection.parent instanceof SampledSchema) {
      this.listenTo(this.collection.parent, 'sync', this.makeFieldVisible);
    } else {
      this.listenTo(this.parent, 'change:visible', this.makeFieldVisible);
    }
    this.on('refine', this.onRefineQuery);
    if (this.parent.getType() === 'Collection') {
      // I'm the global FieldListView, remembering query context
      this.queryContext = _.clone(app.queryOptions.query);
    }
  },
  onRefineQuery: function() {
    var views = this.fieldCollectionView.views;
    var clauses = _.flatten(_.map(views, function(view) {
      return view.getClauses();
    }));
    this.refineQuery = new Query({
      clauses: clauses
    });
    if (this.parent.getType() === 'Collection') {
      // fill clauses with query context unless they are further refined by user
      this.queryContext.clauses.each(function(clause) {
        this.refineQuery.clauses.add(clause);
        // if (!_.find(clauses, function(cl) {
        //   return cl.id === clause.id;
        // })) {
        //   clauses.push(clause);
        // }
      }.bind(this));
      // I'm the global FieldListView, changing query in app
      app.queryOptions.query = this.refineQuery;
    }
  },
  makeFieldVisible: function() {
    this.queryContext = _.clone(app.queryOptions.query);
    var views = this.fieldCollectionView.views;
    _.each(views, function(field_view) {
      raf(function() {
        field_view.visible = true;
      });
    });
  },
  render: function() {
    this.renderWithTemplate();
    this.fieldCollectionView = this.renderCollection(this.collection,
      FieldView, this.queryByHook('fields'));
  }
});

module.exports = FieldListView;
