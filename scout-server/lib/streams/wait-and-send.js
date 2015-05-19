var es = require('event-stream');

module.exports = function waitAndSend(req, res, next) {
  return es.wait(function(err, data) {
    if (err) return next(err);
    res.send(data);
  });
};
