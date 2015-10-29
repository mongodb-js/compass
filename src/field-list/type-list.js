var View = require('ampersand-view');
var format = require('util').format;
var numeral = require('numeral');
var tooltipMixin = require('../tooltip-mixin');
var _ = require('lodash');
// var debug = require('debug')('scout:field-list:type-list');

var TypeListView;

var TypeListItem = View.extend(tooltipMixin, {
  template: require('./type-list-item.jade'),
  modelType: 'TypeListItem',
  bindings: {
    active: {
      type: 'booleanClass',
      name: 'active'
    },
    selected: {
      type: 'booleanClass',
      name: 'selected'
    },
    'model.name': [
      {
        hook: 'name'
      },
      {
        hook: 'bar',
        type: function(el) {
          el.classList.add('schema-field-type-' + this.model.getId().toLowerCase());
        }
      }
    ],
    probability_percentage: {
      hook: 'bar',
      type: function(el) {
        el.style.width = this.probability_percentage;
      }
    },
    tooltip_message: {
      type: function() {
        // need to set `title` and `data-original-title` due to bug in bootstrap's tooltip
        // @see https://github.com/twbs/bootstrap/issues/14769
        this.tooltip({
          title: this.tooltip_message,
          placement: this.isSubtype ? 'bottom' : 'top',
          container: 'body'
        }).attr('data-original-title', this.tooltip_message);
      }
    }
  },
  session: {
    parent: 'state',
    active: {
      type: 'boolean',
      default: false
    },
    selected: {
      type: 'boolean',
      default: false
    }
  },
  derived: {
    probability_percentage: {
      deps: ['model.probability'],
      fn: function() {
        // no rounding, use exact proportions for relative widths
        return this.model.probability * 100 + '%';
      }
    },
    tooltip_message: {
      deps: ['model.probability'],
      fn: function() {
        return format('%s (%s)', this.model.getId(), numeral(this.model.probability).format('%'));
      }
    },
    isSubtype: {
      deps: ['parent'],
      fn: function() {
        return this.parent.hasSubtypes;
      }
    }
  },
  events: {
    'click .schema-field-type-document': 'documentTypeClicked',
    'click .schema-field-wrapper': 'typeClicked'
  },
  subviews: {
    subtypeView: {
      hook: 'array-subtype-subview',
      waitFor: 'model.types',
      prepareView: function(el) {
        return new TypeListView({
          el: el,
          parent: this,
          hasSubtypes: true,
          collection: this.model.types
        });
      }
    }
  },
  documentTypeClicked: function(evt) {
    // expands the nested subdocument fields by triggering click in FieldView
    this.parent.parent.click();
  },
  typeClicked: function(evt) {
    evt.stopPropagation();

    if (this.active) {
      // @todo rueckstiess: already active, query building mode
      // this.toggle('selected');
    } else {
      // no clicks on Undefined allowed
      if (this.model.getId() === 'Undefined') {
        return;
      }

      // find the field view, at most 2 levels up
      var fieldView = this.parent.parent;
      if (fieldView.getType() !== 'FieldView') {
        fieldView = fieldView.parent.parent;
      }
      // if type model has changed, render its minichart
      if (fieldView.type_model !== this.model) {
        fieldView.types.deactivateAll();
        this.active = true;
        this.selected = false;
        fieldView.type_model = this.model;
        fieldView.renderMinicharts();
      }
    }
  }
});


TypeListView = module.exports = View.extend({
  modelType: 'TypeListView',
  session: {
    collectionView: 'object',
    hasSubtypes: {
      type: 'boolean',
      default: false
    },
    parent: 'state'
  },
  template: require('./type-list.jade'),
  deactivateAll: function() {
    if (!this.collectionView) {
      return;
    }
    _.each(this.collectionView.views, function(typeView) {
      typeView.active = false;
      typeView.selected = false;
    });
    // also deactivate the array subtypes
    if (!_.get(this, 'parent.isSubtype')) {
      var arrayView = _.find(this.collectionView.views, function(view) {
        return view.model.name === 'Array';
      });
      if (arrayView) {
        arrayView.subtypeView.deactivateAll();
      }
    }
  },
  render: function() {
    if (!_.get(this, 'parent.isSubtype')) {
      this.renderWithTemplate(this);
      this.collectionView = this.renderCollection(this.collection, TypeListItem,
        this.queryByHook('types'));
    }
    if (!this.hasSubtypes) {
      this.collectionView.views[0].active = true;
    }
  }
});
