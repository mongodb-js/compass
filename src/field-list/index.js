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
    minichartView: 'view'
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
          collection: this.model.types.sort()
        });
      }
    },
    fields: {
      hook: 'fields-subview',
      waitFor: 'model.fields',
      prepareView: function(el) {
        return new FieldListView({
          el: el,
          parent: this,
          collection: this.model.fields
        });
      }
    },
    arrayFields: {
      hook: 'arrayfields-subview',
      waitFor: 'model.arrayFields',
      prepareView: function(el) {
        return new FieldListView({
          el: el,
          parent: this,
          collection: this.model.arrayFields
        });
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
  onRefineClause: function() {
    this.refineClause.value = this.minichartView.refineValue;
    this.parent.trigger('refine', this);
  },
  renderMinicharts: function() {
    this.type_model = this.type_model || this.model.types.at(0);

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
  session: {
    fieldCollectionView: 'view'
  },
  children: {
    refineQuery: Query
  },
  template: require('./index.jade'),
  initialize: function() {
    if (this.collection.parent instanceof SampledSchema) {
      this.listenTo(this.collection.parent, 'sync', this.makeFieldVisible);
    } else {
      this.listenTo(this.parent, 'change:visible', this.makeFieldVisible);
    }
    this.on('refine', this.onRefineQuery);
  },
  onRefineQuery: function() {
    var views = this.fieldCollectionView.views;
    this.refineQuery.clauses.reset(
      _(views)
        .filter(function(view) {
          return view.refineClause.valid;
        })
        .pluck('refineClause')
        .value()
    );
    app.queryOptions.query = this.refineQuery.serialize();
  },
  makeFieldVisible: function() {
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
