var BaseResource = require('./base');
var _ = require('lodash');
var callerId = require('caller-id');
var format = require('util').format;
var uuidv4 = require('uuid/v4');

// var debug = require('debug')('mongodb-js-metrics:resources:error');

module.exports = BaseResource.extend({
  id: 'Error',
  props: {
    eventTrackers: ['array', true, function() {
      return ['ga', 'bugsnag', 'intercom'];
    }]
  },
  /**
   * prepare GA hit with a `exception` hitType.
   *
   * @param {Error} err          error to be sent
   * @param {Object} metadata    metadata for `exception` hit types
   * @param {Function} callback  an optional callback function
   *
   * @api private
   */
  _send_ga_exception: function(err, metadata, callback) {
    var errStr = format('index.js:%s %s', err.lineno, err.message);
    metadata = _.defaults(metadata || {}, {
      hitType: 'exception',
      exDescription: errStr,
      exFatal: _.get(metadata, 'fatal', false)
    });
    this._send_ga(metadata, callback);
  },
  /**
   * prepare sending an exception to bugsnag.
   *
   * @param {Error} error       the error to be sent
   * @param {Object} metadata   metadata containing metadata to be sent
   * @api private
   */
  _send_bugsnag: function(error, metadata) {
    var severity = _.get(metadata, 'severity', callerId.getData().methodName);
    metadata = _.omit(metadata, 'severity');

    var tracker = this.trackers.get('bugsnag');
    if (tracker) {
      tracker.send(error, metadata || {}, severity);
    }
  },
  /**
   * send an informational message to bugsnag (severity: info)
   * @param  {Error} err        error object
   * @param  {Object} metadata  additional metadata
   */
  info: function(err, metadata) {
    this._send_bugsnag(err, metadata);
  },
  /**
   * send an warning message to bugsnag (severity: warning)
   * @param  {Error} err        error object
   * @param  {Object} metadata  additional metadata
   */
  warning: function(err, metadata) {
    this._send_bugsnag(err, metadata);
  },
  /**
   * send an error message to bugsnag (severity: error)
   * @param  {Error} err        error object
   * @param  {Object} metadata  additional metadata
   */
  error: function(err, metadata, callback) {
    // @todo redact error before sending to intercom
    var that = this;
    var payload = _.pick(err, ['name', 'message', 'lineno', 'stack']);
    var trackersMap = {
      ga: function() {
        that._send_ga_exception(err, metadata, callback);
      },
      bugsnag: function() {
        that._send_bugsnag(err, metadata);
      },
      intercom: function() {
        that._send_intercom('Error', payload);
      },
      stitch: function() {
        that._send_stitch('Error error', _.merge({}, payload, metadata, { 'event id': uuidv4() }));
      }
    };

    _.forEach(this.eventTrackers, function(trackerName) {
      var tracker = trackersMap[trackerName] || function() {};
      tracker();
    });
  }
});
