exports.bugsnag = require('./bugsnag');
exports.ga = require('./ga');
exports.intercom = require('./intercom');
var debug = require('debug')('mongodb-js-metrics');

exports.track = function(title, meta) {
  debug('track', {
    title: title,
    meta: meta
  });
};

exports.error = function(err, title, meta) {
  debug('error', {
    err: err,
    title: title,
    meta: meta
  });

  exports.bugsnag.notifyException(err, title, meta);
};

exports.listen = function(app) {
  if (!app || !app.isFeatureEnabled) {
    return;
  }
  exports.intercom.listen(app);
  exports.bugsnag.listen(app);
  exports.ga.listen(app);
};
