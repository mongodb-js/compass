exports.bugsnag = require('./bugsnag');
exports.ga = require('./ga');
exports.intercom = require('./intercom');

exports.track = function() {};
exports.error = function() {};

exports.listen = function(app) {
  if (!app || !app.isFeatureEnabled) {
    return;
  }
  exports.intercom.listen(app);
  exports.bugsnag.listen(app);
  exports.ga.listen(app);
};
