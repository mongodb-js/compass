var VizView = require('./viz');
var _ = require('lodash');
var debug = require('debug')('scout-ui:minicharts:unique');

module.exports = VizView.extend({
  template: require('./unique.jade'),
  derived: {
    randomValues: {
      deps: ['orderedValues'],
      cache: false,
      fn: function() {
        return _(this.model.values.sample(15))
          .map(function(x) {
            return x.value;
          })
          .value();
      }
    }
  },
  events: {
    'mousedown [data-hook=refresh]': 'refresh'
  },
  render: function() {
    this.renderWithTemplate(this);
  },
  refresh: function(event) {
    debug('refresh clicked');
    event.stopPropagation();
    event.preventDefault();
    this.render();
  }

});
