/*
 * Take errors from the driver and converts them into the appropriate
 * `boom` error instances with more user friendly messages.
 *
 * @todo Move to it's own `mongodb-boom` module
 */
var boom = require('boom');


function decodeDriverError(err, msg, fn) {
  // mongod won't let us connect anymore because we have too many idle
  // connections to it.  Restart the process to flush and get back to
  // a clean state.
  if (/connection closed/.test(msg)) {
    err = boom.serverTimeout('Too many connections to mongod');
  } else if (/cannot drop/.test(msg)) {
    err = boom.badRequest('This index cannot be destroyed');
    err.code = 400;
    err.http = true;
  } else if (/auth failed/.test(msg)) {
    err = boom.forbidden('Invalid auth credentials');
  } else if (/connection to \[.*\] timed out/.test(msg)) {
    err = boom.notFound('Could not connect to MongoDB because the conection timed out');
  } else if (msg.indexOf('failed to connect') > -1) { // Host not reachable
    err = boom.notFound('Could not connect to MongoDB.  Is it running?');
  } else if (/does not exist/.test(msg)) {
    err = boom.notFound(msg);
  } else if (/already exists/.test(msg)) {
    err = boom.conflict(msg);
  } else {
    // Have a case where we're not properly validating invalid
    // replicaset commands on a deployment with no replicaset.else if (/valid replicaset|No primary found in set/.test(msg)) {
    err = boom.badRequest(msg);
  }
  fn(err);
}

function sendBoom(res, err) {
  res.format({
    text: function() {
      res.status(err.output.statusCode).send(err.output.payload.message);
    },
    json: function() {
      res.status(err.output.statusCode).send(err.output.payload);
    },
  });
}

module.exports = function(err, req, res, next) {
  console.error('handling error', err.stack);
  if (err && err.isBoom) return sendBoom(res, err);

  var msg = err.message || err.err;
  decodeDriverError(err, msg, function(err) {
    if (!err.isBoom) return next(err);
    sendBoom(res, err);
  });
};
