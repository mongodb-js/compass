var VizView = require('./viz');
var _ = require('lodash');
var debug = require('debug')('scout-ui:minicharts:unique');

module.exports = VizView.extend({
  template: require('./unique.jade'),
  derived: {
    orderedValues: {
      deps: ['model.values'],
      cache: true,
      fn: function() {
        return this.model.values.toJSON().sort();
      }
    },
    minValue: {
      deps: ['orderedValues'],
      cache: true,
      fn: function() {
        return this.orderedValues[0];
      }
    },
    maxValue: {
      deps: ['orderedValues'],
      cache: true,
      fn: function() {
        return this.orderedValues[this.orderedValues.length - 1];
      }
    },
    randomValues: {
      deps: ['orderedValues'],
      cache: false,
      fn: function() {
        return this.orderedValues.slice(1, 5);
      }
    }
  },
  events: {
    'click .fa-refresh': 'refresh'
  },
  render: function() {
    this.renderWithTemplate(this);
  },
  refresh: function() {
    debug('refresh clicked');
  }

});
