var flatnest = require('flatnest');
var es = require('event-stream');

module.exports = function flatten() {
  return es.map(function(data, fn) {
    fn(null, flatnest.flatten(data));
  });
};
