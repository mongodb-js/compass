var es = require('event-stream');

module.exports = function setHeaders(req, res, headers) {
  var _sent = false;
  return es.map(function(data, fn) {
    if (!_sent) {
      _sent = true;
      res.set(headers);
    }
    fn(null, data);
  });
};
