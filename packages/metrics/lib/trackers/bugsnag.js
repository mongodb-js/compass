var State = require('ampersand-state');
var _ = require('lodash');
var singleton = require('singleton-js');
var redact = require('mongodb-redact');

var debug = require('debug')('mongodb-js-metrics:trackers:bugsnag');

/**
 * Error name constant to ignore.
 */
var MONGO_ERROR = 'MongoError';

var BugsnagTracker = State.extend({
  id: 'bugsnag',
  // assign properties to bugsnag handler
  props: {
    apiKey: ['string', true, ''], // set through metrics.configure()
    autoNotify: ['boolean', true, true],
    metaData: ['object', false],
    appVersion: ['string', true, ''], // set by App resource
    notifyReleaseStages: {
      type: 'array',
      default: function() {
        return ['development', 'production'];
      }
    }
  },
  // don't assign any of these to bugsnag handler
  session: {
    enabled: {
      type: 'boolean',
      required: true,
      default: false
    },
    appStage: ['string', true, ''], // set by App resource
    userId: ['string', true, ''], // set by User resource
    bugsnagHandler: ['object', false, null]
  },
  derived: {
    enabledAndConfigured: {
      deps: ['enabled', 'apiKey'],
      fn: function() {
        return this.enabled && this.apiKey !== '';
      }
    },
    // this is just a rename of `appStage`, set by App resource, but bugsnag
    // requires the name to be releaseStage
    releaseStage: {
      deps: ['appStage'],
      fn: function() {
        return this.appStage;
      }
    },
    // this wraps the userId, set by User resource, bugsnag requires a user
    // object instead of a single ID.
    user: {
      deps: ['userId'],
      fn: function() {
        return {
          id: this.userId
        };
      }
    }
  },
  initialize: function() {
    this._configureBugsnag = this._configureBugsnag.bind(this);
    this.beforeNotify = this.beforeNotify.bind(this);

    // when any of the properties change, re-configure bugsnag handler
    this.on('change', this._configureBugsnag);
  },
  /**
   * configure the bugsnag handler based on props and derived props. Called
   * whenever a property changes.
   */
  _configureBugsnag: function() {
    if (this.enabledAndConfigured) {
      if (typeof window !== 'undefined') {
        this.bugsnagHandler =
          this.bugsnagHandler || require('bugsnag-js').noConflict();
        var options = this.serialize({ props: true, derived: true });
        options.beforeNotify = this.beforeNotify;
        delete options.enabledAndConfigured;
        debug('configuring bugsnag with %j', options);
        _.assign(this.bugsnagHandler, options);
      }
    }
  },
  /**
   * callback handler before bugsnag sends anything out. Return `false` to
   * abort the notification, or true to send it. The payload can also be
   * modified, i.e. redacted.
   *
   * @param  {Object} payload    payload to be sent to bugsnag
   * @return {Boolean}           false to abort, true to send to bugsnag
   */
  beforeNotify: function(payload) {
    // never send if this tracker is disabled or it is a mongo error.
    //
    // @note: durran: MongoErrors for our purposes are errors that are
    //  already shown to the user and require them to adjust their input
    //  to resolve them. They should not clutter up Bugsnag as there is
    //  no action from our perspective to take on them.
    if (!this.enabled || payload.name === MONGO_ERROR) {
      return false;
    }

    payload.stacktrace = redact(payload.stacktrace);
    payload.context = redact(payload.context);
    payload.file = redact(payload.file);
    payload.message = redact(payload.message);
    payload.url = redact(payload.url);
    payload.name = redact(payload.name);

    // group errors with same message in bugsnag dashboard
    if (payload.metaData) {
      payload.metaData.groupingHash = payload.message;
    }

    debug('sending report to bugsnag', payload);
    return true;
  },
  /**
   * Method to manually send errors to bugsnag (normally, all uncaught
   * exceptions at the `window.onerror` level are sent to bugsnag automatically)
   * @see https://bugsnag.com/docs/notifiers/js#autonotify
   *
   * @param {Error}  error      Error object to be sent
   * @param {Object} metadata   Metadata can be attached, @see https://bugsnag.com/docs/notifiers/js#metadata
   * @param {[type]} severity   must be one of `info`, `warning`, `error`
   */
  send: function(error, metadata, severity) {
    if (!this.enabled) {
      // this prevents the notification from going out
      return;
    }
    this.bugsnagHandler.notifyException(error, undefined, metadata, severity);
  }
});

module.exports = singleton(BugsnagTracker);
