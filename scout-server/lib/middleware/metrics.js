/**
 * Middleware that collects and sends metrics to a statsd node running locally.
 * @see https://github.com/imlucas/mongoscope-statsd
 */

var Lynx = require('lynx'),
  client = null;

function createClient(opts) {
  if (!client) {
    opts = opts || {};
    opts.host = opts.host || '127.0.0.1';
    opts.port = opts.port || 8125;
    opts.scope = 'scout.stats';
    client = new Lynx(opts.host, opts.port, {
      scope: opts.scope
    });
  }
  return client;
}

module.exports = function(opts) {
  createClient(opts);
  return function statsd(req, res, next) {
    var startTime = new Date().getTime();

    // Function called on response finish that sends stats to statsd
    function sendStats() {
      var key = req.statsdKey ? req.statsdKey + '.' : '';

      // Status Code
      var statusCode = res.statusCode || 'unknown_status';
      client.increment(key + 'status_code.' + statusCode);

      // Response Time
      var duration = new Date().getTime() - startTime;
      client.timing(key + 'response_time', duration);

      cleanup();
    }

    // Function to clean up the listeners we've added
    function cleanup() {
      res.removeListener('finish', sendStats);
      res.removeListener('error', cleanup);
      res.removeListener('close', cleanup);
    }

    // Add response listeners
    res.once('finish', sendStats);
    res.once('error', cleanup);
    res.once('close', cleanup);

    if (next) next();
  };
};
