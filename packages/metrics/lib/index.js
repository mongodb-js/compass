exports.bugsnag = require('./bugsnag');
exports.googleAnalytics = require('./google-analytics');
exports.intercom = require('./intercom');
var debug = require('debug')('mongodb-js-metrics');

exports.timing = function() {};

exports.track = function(title, meta) {
  debug('track', {
    title: title,
    meta: meta
  });

  exports.intercom.track(title, meta);
  exports.googleAnalytics.track(title, meta);
};

exports.error = function(err, title, meta) {
  debug('error', {
    err: err,
    title: title,
    meta: meta
  });

  exports.bugsnag.notifyException(err, title, meta);
  exports.intercom.error(err, title, meta);
  exports.googleAnalytics.error(err, title, meta);
};

exports.listen = function(app) {
  if (!app || !app.isFeatureEnabled) {
    return;
  }
  exports.intercom.listen(app);
  exports.bugsnag.listen(app);
  exports.googleAnalytics.listen(app);
};
