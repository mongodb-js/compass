/**
 * Bugsnag captures errors in real-time from Compass, which helps us understand
 * and resolve them as fast as possible.  It's very similar to
 * [Sentry](https://getsentry.com), [Exceptional](https://www.exceptional.io/),
 * and [airbrake](https://airbrake.io/).  We trust it because it's used in
 * production by GitHub for Atom Editor and Docker for Kitematic.
 *
 * For an invite to view error reports, email lucas@mongodb.com.
 */
var bugsnag = require('bugsnag-js');
var redact = require('./redact');
var app = require('ampersand-app');
var _ = require('lodash');
var debug = require('debug')('scout:bugsnag');

var TOKEN = '0d11ab5f4d97452cc83d3365c21b491c';

// @todo (imlucas): use mongodb-redact
function beforeNotify(d) {
  app.sendMessage('show bugsnag OS notification', d.message);

  d.stacktrace = redact(d.stacktrace);
  d.context = redact(d.context);
  d.file = redact(d.file);
  d.message = redact(d.message);
  d.url = redact(d.url);
  d.name = redact(d.name);
  d.file = redact(d.file);
  d.metaData = redact(d.metaData);
  debug('redacted bugsnag report\n', JSON.stringify(d, null, 2));
}

module.exports = bugsnag;

/**
 * Configure bugsnag's api client which attaches a handler to
 * `window.onerror` so any uncaught exceptions are trapped and logged
 * to the API.
 * @see https://github.com/bugsnag/bugsnag-js#configuration
 * @todo (imlucas): When first-run branch merged, include user id:
 *   https://github.com/bugsnag/bugsnag-js#user
 */
module.exports.listen = function listen() {
  _.assign(bugsnag, {
    apiKey: TOKEN,
    autoNotify: true,
    releaseStage: process.env.NODE_ENV,
    notifyReleaseStages: ['production', 'development'],
    appVersion: app.meta['App Version'],
    metaData: app.meta,
    beforeNotify: beforeNotify
  });

  app.bugsnag = bugsnag;
};
