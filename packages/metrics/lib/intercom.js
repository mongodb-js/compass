/**
 * Intercom
 *
 * @see https://docs.intercom.io/intercom-javascript-api/
 */
var _ = require('lodash');
var debug = require('debug')('mongodb-js-metrics:intercom');
var isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  /* eslint new-cap:0 */
  var i = function() {
    i.c(arguments);
  };
  i.q = [];
  i.c = function(args) {
    i.q.push(args);
  };
  window.Intercom = i;
}

/**
 * @api private
 */
exports.app = null;

/**
 * @param {String} eventName
 * @param {Object} meta
 * @see https://doc.intercom.io/api#event-model
 *
 * @todo (imlucas): Expose to main renderer via IPC so the server can track
 * whatever events it needs to as well.
 *
 * @api private
 */
exports.track = function(eventName, meta) {
  if (!exports.app.isFeatureEnabled('intercom')) {
    return;
  }

  debug('trackEvent `%s`', eventName, meta);
  window.Intercom('trackEvent', eventName, meta);
};

/**
 * @param {Error} err
 * @param {String} title
 * @param {Object} [meta]
 *
 * @api private
 */
exports.error = function(err, title, meta) {
  exports.track('Error: ' + title + ': ' + err.message, meta);
};


/**
 * @param {Object} [user]
 * @return {object}
 * @api private
 */
exports.getIntercomSettings = function(user) {
  if (!user && exports.app && exports.app.user) {
    user = exports.app.user;
  }

  var d = _.extend(_.get(exports, 'app.config.intercom'), {
    NODE_ENV: process.env.NODE_ENV
  });

  if (user && user.toJSON) {
    d = _.extend(d, user.toJSON());
    d.user_id = user.getId();
  }

  debug('Settings are:', d);
  return d;
};

/**
 * @param {Object} [user]
 *
 * @api private
 */
exports.setUser = function(user) {
  if (exports.app) {
    throw new TypeError('metrics.intercom.setUser called before exports.app set!');
  }

  if (!exports.app.isFeatureEnabled('intercom')) {
    debug('not enabled');
    return;
  }

  window.Intercom('boot', exports.getIntercomSettings(user));
};

/**
 * Show the intercom launcher button, aka "the green plus".
 *
 * @api public
 */
exports.show = function() {
  var el = document.querySelector('#intercom-container .intercom-launcher');
  if (el) {
    el.classList.remove('hidden');
  }
};

/**
 * Hide the intercom launcher button, aka "the green plus".
 *
 * @api public
 */
exports.hide = function() {
  var el = document.querySelector('#intercom-container .intercom-launcher');
  if (!el) {
    setTimeout(exports.hide, 100);
    return;
  }
  el.classList.add('hidden');
};

/**
 * Open the intercom chat window.
 *
 * @param {Object} opts
 * @option {String} message - Prefill the chat window with a message.
 *
 * @api public
 */
exports.open = function(opts) {
  opts = opts || {};
  debug('open with options:', opts);

  if (opts && opts.message) {
    debug('showing with message: `%s`', opts.message);
    window.Intercom('showNewMessage', opts.message);
  } else {
    debug('showing...');
    window.Intercom('show');
  }
  exports.show();
};

/**
 * App state has been updated so notfiy intercom of it.
 *
 * @api private
 */
exports.update = function() {
  var d = exports.getIntercomSettings();
  debug('updating with data', d);
  window.Intercom('update', d);
};

/**
 * Injects the intercom client script.
 *
 * @param {Object} app
 * @api private
 */
exports.listen = function(app) {
  if (!app.isFeatureEnabled('intercom')) {
    debug('intercom is not enabled');
    return;
  }

  if (!isBrowser) {
    console.warn('mongodb-js-metrics:intercom: @todo (imlucas) '
      + 'Update to use new intercom module so this works for server.');
    return;
  }

  exports.app = app;

  debug('injecting widget...');
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://widget.intercom.io/widget/p57suhg7';
  head.appendChild(script);

  if (app.user) {
    debug('adding listener to user to boot intercom');
    app.user.on('sync', exports.setUser.bind(null, app.user));
  } else {
    /* eslint no-console:0 */
    console.warn('mongodb-js-metrics:intercom: No `app.user` '
      + 'found so you must call `metrics.intercom.boot` manually!');
  }

  if (app.router) {
    debug('adding listener to router to update intercom');
    app.router.on('page', exports.update);
  } else {
    /* eslint no-console:0 */
    console.warn('mongodb-js-metrics:intercom: No `app.router` '
      + 'found so you must call `metrics.intercom.update` manually!');
  }
  debug('listening!');
};

module.exports = exports;
