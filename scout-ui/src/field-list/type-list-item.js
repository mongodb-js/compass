var AmpersandView = require('ampersand-view');
var $ = require('jquery');
var format = require('util').format;
var _ = require('underscore');
var numeral = require('numeral');

require('bootstrap/js/tooltip');

module.exports = AmpersandView.extend({
  bindings: {
    'model._id': [
      {
        hook: '_id'
      },
      {
        hook: 'bar',
        type: function(el) {
          $(el).addClass('schema-field-type-' + this.model.getId().toLowerCase());
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
  derived: {
    percent: {
      deps: ['model.probability'],
      fn: function() {
        return this.model.probability;
      }
    }
  },
  initialize: function() {
    this.listenTo(this.model, 'change:probability', _.debounce(function() {
      $(this.el).tooltip({
        title: format('%s (%s)', this.model.getId(), numeral(this.model.probability).format('%'))
      });
    }.bind(this), 300));
  },
  template: require('./type-list-item.jade')
});
