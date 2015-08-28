var View = require('ampersand-view');
var format = require('util').format;
var numeral = require('numeral');
var tooltipMixin = require('../tooltip-mixin');
var _ = require('lodash');
// var debug = require('debug')('scout:field-list:type-list');

var TypeListView;

var TypeListItem = View.extend(tooltipMixin, {
  template: require('./type-list-item.jade'),
  namespace: 'TypeListItem',
  bindings: {
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
          placement: this.hasSubtype ? 'bottom' : 'top'
        }).attr('data-original-title', this.tooltip_message);
      }
    }
  },
  props: {
    parent: 'state'
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
    hasSubtype: {
      deps: ['parent'],
      fn: function() {
        return this.parent.hasSubtype;
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
          hasSubtype: true,
          collection: this.model.types
        });
      }
    }
  },
  typeClicked: function(evt) {
    evt.stopPropagation();

    // no clicks on Undefined allowed
    if (this.model.getId() === 'Undefined') return;

    // find the field view, at most 2 levels up
    var fieldView = this.parent.parent;
    if (fieldView.getType() !== 'FieldView') {
      fieldView = fieldView.parent.parent;
    }

    // if type model has changed, render its minichart
    if (fieldView.type_model !== this.model) {
      fieldView.type_model = this.model;
      fieldView.renderMinicharts();
    }
  },
  render: function() {
    this.renderWithTemplate(this);
  }
});


TypeListView = module.exports = View.extend({
  props: {
    hasSubtype: {
      type: 'boolean',
      default: false
    }
  },
  template: require('./type-list.jade'),
  render: function() {
    if (!_.get(this, 'parent.hasSubtype')) {
      this.renderWithTemplate(this);
      this.renderCollection(this.collection, TypeListItem, this.queryByHook('types'));
    }
  }
});
