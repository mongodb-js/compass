var View = require('ampersand-view');
var format = require('util').format;
var numeral = require('numeral');
var tooltipMixin = require('../tooltip-mixin');

module.exports = View.extend(tooltipMixin, {
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
          title: this.tooltip_message
        }).attr('data-original-title', this.tooltip_message);
      }
    }
  },
  derived: {
    probability_percentage: {
      deps: ['model.probability'],
      fn: function() {
        return numeral(this.model.probability).format('%');
      }
    },
    tooltip_message: {
      deps: ['probability_percentage'],
      fn: function() {
        return format('%s (%s)', this.model.getId(), this.probability_percentage);
      }
    }
  },
  events: {
    'click .schema-field-wrapper': 'typeClicked'
  },
  typeClicked: function() {
    // no clicks on Undefined allowed
    if (this.model.getId() === 'Undefined') return;
    var fieldView = this.parent.parent;
    if (fieldView.type_model !== this.model) {
      fieldView.type_model = this.model;
      fieldView.renderMinicharts();
    }
  },
  render: function() {
    this.renderWithTemplate(this);
  }
});
