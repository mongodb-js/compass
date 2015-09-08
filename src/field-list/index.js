var View = require('ampersand-view');
var TypeListView = require('./type-list');
var MinichartView = require('../minicharts');
var ViewSwitcher = require('ampersand-view-switcher');
var $ = require('jquery');
var debug = require('debug')('scout:field-list');
var _ = require('lodash');
var raf = require('raf');
var SampledSchema = require('../models/sampled-schema');

function handleCaret(el) {
  var $el = $(el);
  // only apply to own caret, not children carets
  if ($el.next().text() !== this.model.name) {
    return;
  }
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
        }), {
          silent: true
        });
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
        }), {
          silent: true
        });
        return this.arrayFieldListView;
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
    debug('setting miniview for type_model_id `%s`', this.type_model.getId());
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
    fieldCollectionView: 'view'
  },
  template: require('./index.jade'),
  initialize: function() {
    if (this.collection.parent instanceof SampledSchema) {
      this.listenTo(this.collection.parent, 'sync', this.makeFieldVisible);
    } else {
      this.listenTo(this.parent, 'change:visible', this.makeFieldVisible);
    }
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
