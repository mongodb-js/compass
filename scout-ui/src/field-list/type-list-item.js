var AmpersandView = require('ampersand-view');
var $ = require('jquery');
var format = require('util').format;
var _ = require('underscore');
var numeral = require('numeral');

require('bootstrap/js/tooltip');

module.exports = AmpersandView.extend({
  bindings: {
    'model.name': [
      {
        hook: 'name'
      },
      {
        hook: 'bar',
        type: function(el) {
          $(el).addClass('schema-field-type-' + this.model.getId().toLowerCase());
        }
      }
    ],
    'model.count': [
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
  derived: {
    percent: {
      deps: ['model.count'],
      fn: function() {
        return this.model.probability;
      }
    }
  },
  initialize: function() {
    this.listenTo(this.model, 'change:count', _.debounce(function() {
      $(this.el).tooltip({
        title: format('%s (%s)', this.model.getId(), numeral(this.model.probability).format('%'))
      });
    }.bind(this), 300));
  },
  template: require('./type-list-item.jade'),
  typeClicked: function() {
    if (this.parent.parent.minichartModel.modelType !== this.model.modelType) {
      this.parent.parent.switchView(this.model);
    }
  }

});
