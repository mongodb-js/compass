var ua = require('universal-analytics');
var debug = require('debug')('mongodb-js-metrics:google-analytics');
var _ = require('lodash');
var TID = 'UA-7301842-14';

exports.visitor = null;

/**
 * @todo (imlucas) Add support for Application Name, ID, Version, etc.
 * https://github.com/peaksandpies/universal-analytics/blob/master/AcceptableParams.md#application-name
 */

/**
 * @param {Object} [user]
 *
 * @api private
 */
exports.setUser = function(user) {
  if (!exports.app) {
    throw new TypeError('metrics.googleAnalytics.setUser called before exports.app set!');
  }

  if (!exports.app.isFeatureEnabled('google-analytics')) {
    debug('not enabled');
    return;
  }

  if (user && user.getId()) {
    exports.visitor = ua(TID, user.getId());
  } else {
    exports.visitor = ua(TID);
  }

  if (process.env.NODE_ENV === 'development') {
    exports.visitor.debug();
    debug('debugging enabled');
  }
  debug('booted!');
  exports.pageview();
};

/**
 * @param {String} hitType - One of `pageview|screenview|event|transaction|item|social|exception|timing`.
 */
exports.send = function(hitType, params) {
  if (!exports.app.isFeatureEnabled('google-analytics')) {
    debug('not enabled');
    return;
  }

  if (!exports.visitor) {
    debug('not booted');
    return;
  }

  /**
   * @see https://jira.mongodb.org/browse/INT-671
   */
  if (process.env.NODE_ENV === 'production') {
    params.documentHostName = 'https://compass.mongodb.com/';
  } else {
    params.documentHostName = 'https://compass-dev.mongodb.com/';
  }
  debug('sending `%s`', hitType, params);
  exports.visitor[hitType](params).send();
};

/**
 * @param {String} title
 * @return {Object}
 * @api private
 */
exports.getParamsFromTitle = function(title) {
  var p = title.split(':');
  var eventCategory = _.trim(p.shift());
  var eventAction = _.trim(p.shift());
  var eventLabel;

  if (p.length > 0) {
    eventLabel = p.join(':');
  }

  return {
    eventCategory: eventCategory,
    eventAction: eventAction,
    eventLabel: eventLabel
  };
};

// exports.timing = function(category, variable, time, label) {};

exports.error = function(err, title, data) {
  var params = exports.getParamsFromTitle(title);
  params = _.extend(params, {
    exceptionDescription: err.message,
    isExceptionFatal: data && data.fatal || false
  });
  exports.send('exception', params);
};

exports.pageview = function() {
  /**
   * @todo (imlucas) Add `req` arg for usage from express middleware.
   */
  var params = {};
  params.documentPath = '/'
    + (document.location.pathname + document.location.hash)
    .split(new RegExp('.html'))[1];

  exports.send('pageview', params);
};

exports.track = function(title, data) {
  if (data instanceof Error) {
    data = {
      error: true,
      error_message: data.message
    };
  }

  var params = exports.getParamsFromTitle(title);
  exports.send('event', params);
};

exports.listen = function(app) {
  if (!app.isFeatureEnabled('google-analytics')) {
    debug('not enabled');
    return;
  }

  exports.app = app;

  if (app.user) {
    debug('adding listener to user');
    app.user.on('sync', exports.setUser.bind(null, app.user));
  } else {
    /* eslint no-console:0 */
    console.warn('mongodb-js-metrics:google-analytics: No `app.user` '
      + 'found so you must call `metrics.googleAnalytics.setUser` manually!');
  }

  if (app.router) {
    debug('adding listener to router');
    app.router.on('page', exports.pageview);
  } else {
    /* eslint no-console:0 */
    console.warn('mongodb-js-metrics:google-analytics: No `app.router` '
      + 'found so you must call `metrics.googleAnalytics.pageView` manually!');
  }
  debug('listening!');
};

module.exports = exports;
