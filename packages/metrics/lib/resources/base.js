var State = require('ampersand-state');
var callerId = require('caller-id');
var TrackerCollection = require('../models/tracker-collection');
var _ = require('lodash');
var format = require('util').format;
var async = require('async');

var debug = require('debug')('mongodb-js-metrics:resources:base');

module.exports = State.extend({
  idAttribute: 'id',
  id: 'Base',
  collections: {
    trackers: TrackerCollection
  },
  initialize: function() {
    this.on('change', this._update_trackers.bind(this));
    this.listenTo(this.trackers, 'add reset', this._update_trackers.bind(this));
  },
  /**
   * Either the trackers or the properties of this resource have changed. In
   * any case, pass own properties to the trackers.
   */
  _update_trackers: function() {
    debug('tracker or properties have changed, updating trackers.', this.serialize());
    this.trackers.each(function(tracker) {
      tracker.set(this.serialize());
    }.bind(this));
  },
  /**
   * send any GA hit. This is the only actual call to GA.
   *
   * @param {Object} options   options to send
   * @param {Function} callback  optional callback handler
   * @api private
   */
  _send_ga: function(options, callback) {
    var tracker = this.trackers.get('ga');
    if (tracker && tracker.enabled) {
      return tracker.send(options, callback);
    }
    if (callback) {
      return callback(null, false);
    }
  },
  /**
   * send any Mixpanel event. This is the only actual call to Mixpanel.
   *
   * @param {String} eventName   name of the event
   * @param {Object} metadata    additional metadata for the eventName
   * @param {Function} callback  optional callback handler
   *
   * @api private
   */
  _send_mixpanel: function(eventName, metadata, callback) {
    var tracker = this.trackers.get('mixpanel');
    if (tracker && tracker.enabled) {
      return tracker.send(eventName, metadata, callback);
    }
    if (callback) {
      return callback(null, false);
    }
  },
  /**
   * send an intercom event. This is the only actual call to the intercom tracker.
   *
   * @param {String} eventName   eventName to send
   * @param {Object} metadata    attached metadata (5 keys max!)
   * @api private
   */
  _send_intercom: function(eventName, metadata, callback) {
    var tracker = this.trackers.get('intercom');
    if (tracker && tracker.enabled) {
      tracker.send(eventName, metadata);
      if (callback) {
        return callback(null, true);
      }
    }
    if (callback) {
      return callback(null, false);
    }
  },
  /**
   * prepare sending an event to all trackers that support events (ga, intercom,
   * mixpanel). Re-format resource and action into `<Resource> <action>` event
   * name, attach all other relevant information as metadata. For Google
   * Analytics, send an event for each key in metadata.
   *
   * @param {Object} metadata    metadata to be sent
   * @param {Function} callback  callback function (optional)
   * @api private
   */
  _send_event: function(metadata, callback) {
    var that = this;
    var resource = _.get(metadata, 'resource', this.id);
    var action = _.get(metadata, 'action', callerId.getData().methodName);
    metadata = _.omit(metadata, ['resource', 'action']);

    var eventName = format('%s %s', resource, action);

    var tasks = {
      intercom: that._send_intercom.bind(that, eventName, metadata),
      mixpanel: that._send_mixpanel.bind(that, eventName, metadata)
    };

    // `Screen` and `Error` resources have their own hit type in Google
    // Analytics, don't send a as an `event` hittype here
    if (['Screen', 'Error'].indexOf(resource) === -1) {
      var opts;
      if (_.isEmpty(metadata)) {
        opts = {
          hitType: 'event',
          eventCategory: resource,
          eventAction: action
        };
        tasks.ga = that._send_ga.bind(that, opts);
      } else {
        var gaTasks = _.map(metadata, function(value, key) {
          opts = {
            hitType: 'event',
            eventCategory: eventName,
            eventAction: key
          };
          if (_.isNumber(value)) {
            opts.eventValue = value;
          } else {
            opts.eventLabel = String(value);
          }
          return that._send_ga.bind(that, opts);
        });
        tasks.ga = function(cb) {
          async.parallel(gaTasks, cb);
        };
      }
    }
    async.parallel(tasks, callback);
  }
});
