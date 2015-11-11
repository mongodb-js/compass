/* eslint new-cap:0 */
var _ = require('lodash');
var debug = require('debug')('mongodb-js-metrics:intercom');

var intercom = function() {
  intercom.c(arguments);
};
intercom.q = [];
intercom.c = function(args) {
  intercom.q.push(args);
};


exports.app = null;

/**
 * App state has been updated so notfiy intercom of it.
 */
exports.update = function() {
  window.Intercom('update');
};

// @todo (imlucas): Expose to main renderer via IPC so the server can track
// whatever events it needs to as well.
exports.track = function(eventName, data) {
  if (!exports.app.isFeatureEnabled('intercom')) {
    return;
  }
  intercom('trackEvent', eventName, data);
};

function boot() {
  var config = _.extend(exports.app.user.toJSON(), {
    app_id: _.get(exports.app.config, 'intercom.app_id')
  });
  config.user_id = exports.app.user.id;
  debug('Syncing user info w/ intercom', config);
  intercom('boot', config);
}

exports.open = function(opts) {
  if (opts && opts.message) {
    intercom('showNewMessage', opts.message);
  } else {
    intercom('show');
  }
};

exports.show = function() {
  var el = document.querySelector('#intercom-container .intercom-launcher');
  if (el) {
    el.classList.remove('hidden');
  }
};

exports.hide = function() {
  var el = document.querySelector('#intercom-container .intercom-launcher');
  if (!el) {
    return setTimeout(exports.hide, 100);
  }
  el.classList.add('hidden');
};

/**
 * Injects the intercom client script.
 * @param {Object} app
 */
exports.listen = function(app) {
  exports.app = app;

  if (!app.isFeatureEnabled('intercom')) {
    debug('intercom is not enabled');
    return;
  }

  if (typeof window === 'undefined') {
    /**
     * @todo (imlucas) Update to use new intercom module
     * that works in browser or server.
     */
    return;
  }

  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://widget.intercom.io/widget/p57suhg7';
  head.appendChild(script);
  if (app.user) {
    debug('adding listener to user to boot intercom');
    app.user.on('sync', boot.bind(null, app));
  }

  if (app.router) {
    debug('adding listener to router to update intercom');
    app.router.on('page', exports.update);
  }
};

if (typeof window !== 'undefined') {
  window.Intercom = intercom;
}

module.exports = exports;
