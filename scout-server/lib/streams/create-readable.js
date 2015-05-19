var _ = require('underscore');
var es = require('event-stream');

module.exports = function readable(doc) {
  if (_.isArray(doc)) return es.readArray(doc);
  if (_.isFunction(doc.stream)) return doc.stream();

  var sent = false;
  return es.readable(function(count, cb) {
    if (sent) return this.emit('end');
    sent = true;
    cb(null, doc || null);
  });
};
