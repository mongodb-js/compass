const d3 = require('d3');
const debug = require('debug')('mongodb-compass:server-stats:dispatch');
// Overload dispatch.on so that it adds to the callbacks, instead of replacing

const customEvent = new function() {
  const charts = {};
  const dispatcher = d3.dispatch('mouseover', 'updatelabels', 'updateoverlay', 'mouseout');

  this.on = function(title, event, cb) {
    if (!(event in charts)) {
      charts[event] = {};
    }
    charts[event][title] = cb;

    dispatcher.on(event, function(arg) {
      for (let key in charts[event]) {
        if (charts[event].hasOwnProperty(key)) {
          charts[event][key](arg);
        }
      }
    });
  };

  this.dispatch = dispatcher;
};


module.exports = customEvent;
