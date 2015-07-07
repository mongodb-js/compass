var AmpersandView = require('ampersand-view');
var $ = require('jquery');
var format = require('util').format;
var _ = require('underscore');
var numeral = require('numeral');
var debug = require('debug')('scout-ui:field-list:type-list-item');

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
  },
  events: {
    'click .schema-field-wrapper': 'typeClicked'
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
    this.listenTo(this.model, 'change:count', _.debounce(function() {
      $(this.el).tooltip({
        title: format('%s (%s)', this.model.getId(), numeral(this.model.probability).format('%'))
      });
      $(this.queryByHook('bar')).css({
        width: Math.floor(this.model.probability * 100) + '%'
      });
    }.bind(this), 300));
  },
  template: require('./type-list-item.jade'),
  typeClicked: function() {
    var fieldList = this.parent.parent;
    if (!fieldList.minichartModel || (fieldList.minichartModel.modelType !== this.model.modelType)) {
      fieldList.switchView(this.model);
    }
  },
  render: function() {
    this.renderWithTemplate(this);
    return this;
  }
});
