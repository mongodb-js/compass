var intercom = require('./intercom');
var bugsnag = require('./bugsnag');
var pkg = require('../package.json');
var _ = require('lodash');
var debug = require('debug')('scout:metrics');

module.exports.track = function(eventName, data) {
  data = _.extend(data || {}, {
    'App Version': pkg.version
  });
  debug('tracking `%s`: %j', eventName, data);
  intercom.track(eventName, data);
};

module.exports.trackError = function(err) {
  debug('tracking error %j', err);
  bugsnag.trackError(err);
};
