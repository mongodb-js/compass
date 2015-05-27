var VizView = require('./viz');
var _ = require('lodash');
var debug = require('debug')('scout-ui:minicharts:unique');

module.exports = VizView.extend({
  props: {
    timer: {
      type: 'number',
      default: null
    }
  },
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
    'mousedown [data-hook=refresh]': 'refresh',
    'mouseup': 'stopTimer'
  },
  render: function() {
    this.renderWithTemplate(this);
  },
  refresh: function(event) {
    if (!this.timer) {
      this.timer = setInterval(this.refresh.bind(this), 600);
    } else {
      clearInterval(this.timer);
      this.timer = setInterval(this.refresh.bind(this), 50);
    }
    if (event) {
      event.preventDefault();
    }
    this.render();
  },
  stopTimer: function(event) {
    clearInterval(this.timer);
    this.timer = null;
  }

});
