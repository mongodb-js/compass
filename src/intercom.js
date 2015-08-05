var _ = require('lodash');
var pkg = require('../package.json');
var app = require('ampersand-app');
var debug = require('debug')('scout:intercom');

var i = function() {
  i.c(arguments);
};
i.q = [];
i.c = function(args) {
  i.q.push(args);
};
window.Intercom = i;

/*eslint new-cap:0*/
/**
 * App state has been updated so notfiy intercom of it.
 */
module.exports.update = function() {
  window.Intercom('update');
};

// @todo (imlucas): use http://npm.im/osx-release and include platform details
// in event tracking.
// @todo (imlucas): Expose to main renderer via IPC so the server can track
// whatever events it needs to as well.
module.exports.track = function(eventName, data) {
  data = _.extend(data || {}, {
    'App Version': pkg.version
  });
  window.Intercom('trackEvent', eventName, data);
};

function boot() {
  var config = _.extend(app.user.toJSON(), {
    app_id: 'p57suhg7'
  });
  config.user_id = app.user.id;
  debug('Syncing user info w/ intercom', config);
  window.Intercom('boot', config);
}

module.exports.open = function(opts) {
  if (opts && opts.message) {
    window.Intercom('showNewMessage', opts.message);
  } else {
    window.Intercom('show');
  }
};

module.exports.show = function() {
  var el = document.querySelector('#intercom-container .intercom-launcher');
  if (el) {
    el.classList.remove('hidden');
  }
};

module.exports.hide = function() {
  var el = document.querySelector('#intercom-container .intercom-launcher');
  if (!el) {
    return setTimeout(module.exports.hide, 100);
  }
  el.classList.add('hidden');
};

/**
 * Injects the intercom client script.
 * @param {models.User} user - The current user.
 */
module.exports.inject = function(user) {
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://widget.intercom.io/widget/p57suhg7';
  head.appendChild(script);
  user.on('sync', boot);
};
