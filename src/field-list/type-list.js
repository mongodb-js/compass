var View = require('ampersand-view');
var format = require('util').format;
var numeral = require('numeral');
var tooltipMixin = require('../tooltip-mixin');
var _ = require('lodash');
var debug = require('debug')('scout:field-list:type-list');

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
          placement: this.hasSubtype ? 'bottom' : 'top',
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
        return numeral(this.model.probability).format('0.00%');
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
    'click .schema-field-wrapper': 'typeClicked'
  },
  subviews: {
    subtypes: {
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
  initialize: function() {
    this.on('change:active', this.activeChanged);
  },
  typeClicked: function(evt) {
    evt.stopPropagation();

    if (this.active) {
      // already active, query building mode
      this.toggle('selected');
    } else {
      // no clicks on Undefined allowed
      if (this.model.getId() === 'Undefined') return;

      // find the field view, at most 2 levels up
      var fieldView = this.parent.parent;
      if (fieldView.getType() !== 'FieldView') {
        fieldView = fieldView.parent.parent;
      }
      // if type model has changed, render its minichart
      if (fieldView.type_model !== this.model) {
        this.active = true;
        fieldView.type_model = this.model;
        fieldView.renderMinicharts();
      }
    }
  },
  activeChanged: function(view, value) {
    debug('active changed to %s for %s -> %s', value, view.model.parent.name, view.model.name);
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
  deactivateOthers: function(view) {
    if (!this.collectionView) return;
    _.each(this.collectionView.views, function(typeView) {
      if (view !== typeView) {
        typeView.active = false;
        typeView.selected = false;
      }
    });
  },
  render: function() {
    this.renderWithTemplate(this);
    this.collectionView = this.renderCollection(this.collection, TypeListItem,
      this.queryByHook('types'));
    this.collectionView.views[0].active = true;
  }
});
