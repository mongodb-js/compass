var VizView = require('./viz');
var _ = require('lodash');

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
        // @hack for demo: show values across all types
        return _(this.model.collection.parent.values.sample(15))
          .map(function(x) {
            return x.value;
          })
          .value();
      }
    }
  },
  events: {
    'mousedown [data-hook=refresh]': 'refresh',
    mouseup: 'stopTimer'
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
  stopTimer: function() {
    clearInterval(this.timer);
    this.timer = null;
  }
});
