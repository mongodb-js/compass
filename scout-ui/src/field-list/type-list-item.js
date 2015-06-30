var View = require('ampersand-view');
var format = require('util').format;
var _ = require('lodash');
var numeral = require('numeral');
var tooltipMixin = require('../tooltip-mixin');

module.exports = View.extend(tooltipMixin, {
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
    'model.probability': [
      {
        hook: 'bar',
        type: function(el) {
          $(el).css({
            width: Math.floor(this.model.probability * 100) + '%'
          });
        }
      }
    ]
  },
  events: {
    'click .schema-field-wrapper': 'typeClicked'
  },
  initialize: function() {
    this.listenTo(this.model, 'change:probability', _.debounce(function() {
      this.tooltip({
        title: format('%s (%s)', this.model.getId(), numeral(this.model.probability).format('%'))
      });
    }.bind(this), 300));
  },
  template: require('./type-list-item.jade'),
  typeClicked: function() {
    if (this.parent.parent.minichartModel.cid !== this.model.cid) {
      this.parent.parent.switchView(this.model);
    }
  }

});
