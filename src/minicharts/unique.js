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
    // re-apply selections after refresh
    this.parent.updateUI_distinct();
  },
  stopTimer: function() {
    clearInterval(this.timer);
    this.timer = null;
  },
  bubbleClicked: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();

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
      self: evt.target,
      evt: evt,
      type: 'click',
      source: 'unique'
    };
    this.trigger('querybuilder', chartEvt);
  }
});
