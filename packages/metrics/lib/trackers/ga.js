var querystring = require('querystring');
var State = require('ampersand-state');
var xhr = typeof window !== 'undefined' ? require('xhr') : require('request');
var _ = require('lodash');
var singleton = require('singleton-js');
var redact = require('mongodb-redact');
var format = require('util').format;

var debug = require('debug')('mongodb-js-metrics:trackers:ga');

// rename property names to google analytics keys
var PROTOCOL_PARAMETER_MAP = {
  version: 'v',
  dataSource: 'ds',
  trackingId: 'tid',
  userId: 'cid',
  hitType: 't',
  appName: 'an',
  appVersion: 'av',
  appPlatform: 'aiid', // we use the app installer id field to track platform
  eventCategory: 'ec',
  eventAction: 'ea',
  eventLabel: 'el',
  eventValue: 'ev',
  timingCategory: 'utc',
  timingVar: 'utv',
  timingValue: 'utt',
  timingLabel: 'utl',
  screenName: 'cd',
  documentPath: 'dp',
  exDescription: 'exd',
  exFatal: 'exf'
};

var GATracker = State.extend({
  id: 'ga',
  props: {
    version: ['number', true, 1],
    dataSource: ['string', true, 'app'],
    trackingId: ['string', true, ''], // set through metrics.configure()
    userId: ['string', true, ''], // set by User resource
    appName: ['string', true, ''], // set by App resource
    appVersion: ['string', true, ''], // set by App resource
    appPlatform: ['string', true, ''] // set by App resource
  },
  session: {
    enabled: {
      type: 'boolean',
      required: true,
      default: false
    },
    // set to true to test against the debug GA endpoint (no data will be
    // collected in the GA property).
    // @see https://developers.google.com/analytics/devguides/collection/protocol/v1/validating-hits
    debug: {
      type: 'boolean',
      required: true,
      default: false
    },
    baseUrl: {
      type: 'string',
      required: true,
      default: 'https://www.google-analytics.com%s/collect?'
    }
  },
  derived: {
    url: {
      deps: ['baseUrl', 'debug'],
      fn: function() {
        return format(this.baseUrl, this.debug ? '/debug' : '');
      }
    }
  },
  /**
   * Send a hit to Google Analytics
   * @param  {Object}   options     constructed in resources
   * @param  {Function} callback    optional callback method
   */
  send: function(options, callback) {
    if (!this.enabled) {
      return;
    }
    callback =
      callback ||
      function(err) {
        if (err) {
          debug('Google Analytics returned error:', err.message);
        }
      };
    // extend options with default options
    _.defaults(options || {}, this.serialize());
    options = this.shortify(options);
    options = redact(options);
    var url = this.url + querystring.stringify(options);
    debug('sending hit to google analytics', options, url);
    xhr.post(url, callback);
  },
  /**
   * Replaces the property names with the GA measurement protocol parameters
   * @see https://developers.google.com/analytics/devguides/collection/protocol/v1/?hl=en
   *
   * @param  {Object} obj    object to pass in
   * @return {Object}        object with replaced keys
   */
  shortify: function(obj) {
    return _.mapKeys(obj, function(value, key) {
      if (PROTOCOL_PARAMETER_MAP[key] === undefined) {
        debug('warning: key %s not found in GA protocol map.', key);
      }
      return PROTOCOL_PARAMETER_MAP[key];
    });
  }
});

module.exports = singleton(GATracker);
