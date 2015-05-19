var setHeaders = require('../streams/set-headers');
var conditional = require('../streams/http-conditional');
var createEventSourceWriteStream = require('event-source-emitter');
var createReadable = require('../streams/create-readable');
var EJSON = require('mongodb-extended-json');
var csv = require('csv-write-stream');

function _createFormatter(mime, req, res, next) {
  var opts = {
    separator: mime === 'text/csv' ? ',' : '\t'
  };

  var transform;
  var headers = setHeaders(req, res, {
    'content-type': mime
  });

  if (['text/csv', 'text/tsv'].indexOf(mime) > -1) {
    transform = csv.bind(null, opts);
  } else {
    transform = EJSON.createStringifyStream;
  }

  return function() {
    createReadable(req.cursor)
    .pipe(conditional(transform, req, res))
    .pipe(headers)
    .pipe(res)
    .on('error', next);
  };
}

module.exports = function format(req, res, next) {
  if (req.headers.accept === 'text/event-stream') {
    return createReadable(req.cursor)
    .pipe(createEventSourceWriteStream(req, res, {
      keepAlive: true
    }));
  }

  res.format({
    'application/json': _createFormatter('application/json', req, res, next),
    'text/csv': _createFormatter('text/csv', req, res, next),
    'text/tsv': _createFormatter('text/tsv', req, res, next),
  });
}
