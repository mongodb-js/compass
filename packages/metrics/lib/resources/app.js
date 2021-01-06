var BaseResource = require('./base');
var async = require('async');
var os = require('os');

module.exports = BaseResource.extend({
  id: 'App',
  props: {
    appName: {
      type: 'string',
      required: true
    },
    appVersion: {
      type: 'string',
      required: true
    },
    appPlatform: {
      type: 'string',
      required: false
    },
    appStage: {
      type: 'string',
      required: false
    },
    osName: {
      type: 'string',
      required: false,
      default: function() {
        return `${os.platform()} ${os.release()}`;
      }
    },
    startTime: {
      type: 'date',
      required: true,
      default: function() {
        return new Date();
      }
    }
  },
  /**
   * ensure appName and appVersion are set on initializing the resource.
   */
  initialize: function() {
    BaseResource.prototype.initialize.apply(this, arguments);
  },
  /**
   * use when you want to track a page, screen or feature view.
   *
   * GA: send a `screenview` hit with the given name. Additional information
   * like app name and version are attached automatically.
   *
   * @param  {String} screenName   screen name, e.g. 'Preference Pane'
   * @param  {function} callback   optional callback
   */
  viewed: function(screenName, callback) {
    var that = this;

    var options = {
      // explicitly set resource and action here because it can't be
      // extracted from inside the async.parallel call.
      resource: 'Screen',
      action: 'viewed',
      screen: screenName
    };
    var gaOptions = {
      hitType: 'screenview',
      screenName: screenName,
      documentPath: screenName // screenName alone doesn't seem to be sufficient
    };
    async.parallel({
      event: that._send_event.bind(that, options),
      ga: that._send_ga.bind(that, gaOptions)
    }, function(err, res) {
      /* eslint consistent-return: 0 */
      if (!callback) {
        return;
      }
      if (err) {
        return callback(err);
      }
      var eventRes = res.event;
      eventRes.ga = res.ga;
      callback(null, eventRes);
    });
  },
  /**
   * use when you want to track an application launch.
   *
   * GA: send a launch `event` hit. Additional information like app name and
   * version are sent as `el` (eventLabel), e.g. `mongodb-metrics 1.2.3`.
   *
   * @param  {Function} callback   optional callback
   */
  launched: function(callback) {
    var options = {
      name: this.appName,
      version: this.appVersion,
      platform: this.appPlatform,
      osName: this.osName
    };
    this._send_event(options, callback);
  },
  /**
   * use when you want to track an application quit.
   *
   * GA: send a quit `event` hit. Additional information like app name and
   * version are sent as `el` (eventLabel), e.g. `mongodb-metrics 1.2.3`.
   *
   * @param  {Number} exitCode     exit code (0 for expected, normal exit)
   * @param  {Function} callback   optional callback
   */
  quit: function(exitCode, callback) {
    var minutesSinceStart = Math.round((new Date() - this.startTime) / 1000 / 60);
    var options = {
      name: this.appName,
      version: this.appVersion,
      platform: this.appPlatform,
      exitCode: exitCode || 0,
      minutesSinceStart: minutesSinceStart,
      osName: this.osName
    };
    this._send_event(options, callback);
  },
  /**
   * use when you want to track an application upgrade.
   *
   * GA: send an upgrade `event` hit. Additional information like app name and
   * versions are sent as `el` (eventLabel), e.g. `mongodb-metrics 1.2.3 -> 1.2.4`.
   *
   * @param  {String} previousVersion   the previous version before the upgrade
   * @param  {Function} callback        optional callback
   */
  upgraded: function(previousVersion, callback) {
    var options = {
      name: this.appName,
      previousVersion: previousVersion,
      version: this.appVersion,
      platform: this.appPlatform,
      osName: this.osName
    };
    this._send_event(options, callback);
  }
});
