var View = require('ampersand-view');
var TypeListView = require('./type-list');
var MinichartView = require('../minicharts');
var ViewSwitcher = require('ampersand-view-switcher');
var $ = require('jquery');
var _ = require('lodash');
var raf = require('raf');
var SampledSchema = require('../models/sampled-schema');

var fieldTemplate = require('../templates').schema.field;
var fieldListTemplate = require('../templates').schema['field-list'];

// var debug = require('debug')('mongodb-compass:schema:field-list');

function handleCaret(el) {
  var $el = $(el);
  // only apply to own caret, not children carets
  if ($el.next().text() !== this.model.name) {
    return;
  }
  if (this.model.fields || this.model.arrayFields) {
    $el.addClass('caret');
    $el.next().css('cursor', 'pointer');
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
    minichartView: 'any'
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
  template: fieldTemplate,
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
    fieldListView: {
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
    arrayFieldListView: {
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
  },
  render: function() {
    this.renderWithTemplate(this);
    this.viewSwitcher = new ViewSwitcher(this.queryByHook('minichart-container'));
  },
  renderMinicharts: function() {
    if (!this.type_model) {
      this.type_model = this.model.types.at(0);
    }
    this.minichartView = new MinichartView({
      model: this.type_model,
      parent: this
    });
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
    fieldCollectionView: 'object'
  },
  template: fieldListTemplate,
  initialize: function() {
    if (this.collection.parent instanceof SampledSchema) {
      this.listenTo(this.collection.parent, 'sync', this.makeFieldVisible);
    } else {
      this.listenTo(this.parent, 'change:visible', this.makeFieldVisible);
    }
  },
  makeFieldVisible: function() {
    var views = this.fieldCollectionView.views;
    _.each(views, function(fieldView) {
      raf(function() {
        fieldView.visible = true;
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
