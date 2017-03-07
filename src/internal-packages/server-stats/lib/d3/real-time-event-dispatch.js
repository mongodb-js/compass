const d3 = require('d3');

function RealTimeEventDispatch() {
  const charts = {};
  const dispatcher = d3.dispatch('mouseover', 'updatelabels', 'updateoverlay', 'mouseout');

  this.on = function(title, event, cb) {
    if (!(event in charts)) {
      charts[event] = {};
    }
    charts[event][title] = cb;

    dispatcher.on(event, function(...args) {
      Object.keys(charts[event]).forEach(key => {
        charts[event][key](...args);
      });
    });
  };

  this.dispatch = dispatcher;
}


module.exports = RealTimeEventDispatch;
