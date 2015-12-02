var ua = require('universal-analytics');
var debug = require('debug')('mongodb-js-metrics:google-analytics');
var _ = require('lodash');
var TID = 'UA-7301842-14';


/**
 * @todo (imlucas) Add support for Application Name, ID, Version, etc.
 * https://github.com/peaksandpies/universal-analytics/blob/master/AcceptableParams.md#application-name
 */

exports.visitor = null;
exports.app = null;
exports.setupDone = false;

/**
 * @param {Object} [user]
 *
 * @api private
 */
exports.setUser = function() {
  if (!exports.app) {
    throw new TypeError('metrics.googleAnalytics.setUser called before exports.app set!');
  }

  if (!exports.app.isFeatureEnabled('googleAnalytics')) {
    debug('google analytics is disabled');
    return;
  }

  var user = exports.app.user;

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
  if (!exports.app.isFeatureEnabled('googleAnalytics')) {
    debug('google analytics is disabled');
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

exports.unlisten = function() {
  if (!exports.setupDone) {
    return;
  }
  if (exports.app) {
    if (exports.app.user) {
      debug('removing listener to user');
      exports.app.user.off('sync', exports.setUser);
    }

    if (exports.app.router) {
      debug('removing listener to router');
      exports.app.router.off('page', exports.update);
    }
  }
  exports.setupDone = false;
};

exports.listen = function(app) {
  exports.app = app;

  if (!app.isFeatureEnabled('googleAnalytics')) {
    exports.unlisten();
    debug('google analytics is disabled');
    return;
  }

  if (app.user) {
    debug('adding listener to user');
    // if user already fetched, set user now
    if (app.user.fetched) {
      exports.setUser(app.user);
    }
    // listen to updates to the user object
    app.user.on('sync', exports.setUser);
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
  exports.setupDone = true;
};

module.exports = exports;
