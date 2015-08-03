var VizView = require('./viz');
var _ = require('lodash');

module.exports = VizView.extend({
  session: {
    timer: {
      type: 'number',
      default: null
    }
  },
  template: require('./unique.jade'),
  derived: {
    randomValues: {
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
    mouseup: 'stopTimer',
    'click .bubble > code': 'bubbleClicked'
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
  },
  bubbleClicked: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var all = this.queryAll('.bubble > code');
    var i = all.indexOf(evt.target);
    var value = evt.target.innerText;
    if (this.model.getType() === 'Number') {
      value = parseFloat(value, 10);
    }
    var chartEvt = {
      d: {
        label: evt.target.innerText,
        value: value,
        count: 1
      },
      i: i,
      self: evt.target,
      all: this.queryAll('.bubble > code'),
      evt: evt,
      type: 'click',
      source: 'unique'
    };
    this.trigger('querybuilder', chartEvt);
  }
});
