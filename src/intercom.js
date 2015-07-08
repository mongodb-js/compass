var _ = require('lodash');
var pkg = require('../package.json');

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
    app_version: pkg.version
  });
  window.Intercom('trackEvent', eventName, data);
};

/**
 * Injects the intercom client script.
 */
module.exports.inject = function(user) {
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://widget.intercom.io/widget/p57suhg7';
  head.appendChild(script);

  var config = _.extend(user.toJSON(), {
    app_id: 'p57suhg7'
  });
  config.user_id = user.id;
  window.Intercom('boot', config);
};
