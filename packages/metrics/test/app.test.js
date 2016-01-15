var metrics = require('../lib')();
var resources = require('../lib/resources');
var assert = require('assert');
var pkg = require('../package.json');
var process = require('process');
var common = require('./common');

var DEBUG = true;

describe('App Resource', function() {
  var app;

  beforeEach(function() {
    // create metrics object and initialize
    metrics.configure({
      ga: {
        debug: DEBUG,
        enabled: true,
        trackingId: 'UA-71150609-2'
      }
    });

    metrics.resources.reset();

    // create a new app resource
    app = new resources.AppResource({
      appName: pkg.name,
      appVersion: pkg.version,
      appPlatform: process.platform
    });
  });

  it('should have `App` as its id', function() {
    assert.equal(app.id, 'App');
  });

  it('should have appName, appVersion, appPlatform after adding the app resource', function() {
    metrics.addResource(app);
    assert.equal(metrics.trackers.get('ga').appName, pkg.name);
    assert.equal(metrics.trackers.get('ga').appVersion, pkg.version);
    assert.equal(metrics.trackers.get('ga').appPlatform, process.platform);
  });

  it('should update the parameters when they change on the app resource', function() {
    metrics.addResource(app);
    assert.equal(metrics.trackers.get('ga').appName, pkg.name);
    app.appName = 'AngryWolvesWithTinyWings';
    assert.equal(metrics.trackers.get('ga').appName, 'AngryWolvesWithTinyWings');
    app.appVersion = '0.0.1';
    assert.equal(metrics.trackers.get('ga').appVersion, '0.0.1');
    app.appPlatform = 'darwin';
    assert.equal(metrics.trackers.get('ga').appPlatform, 'darwin');
  });

  it('should attach the right protocol parameters for a `viewed` screenview', function(done) {
    // mock function to intercept options
    app._send_ga = function(options) {
      assert.equal(options.hitType, 'screenview');
      assert.equal(options.screenName, 'MyScreenName');
      assert.equal(options.documentPath, 'MyScreenName');
      done();
    };
    app.viewed('MyScreenName');
  });

  it('should attach the right protocol parameters for a `launched` event', function(done) {
    // mock function to intercept options
    var actions = {};
    var count = 0;
    app._send_ga = function(options) {
      assert.equal(options.hitType, 'event');
      assert.equal(options.eventCategory, 'App launched');
      actions[options.eventAction] = typeof options.eventValue !== 'undefined' ?
        options.eventValue : options.eventLabel;
      count ++;
      if (count === 3) {
        assert.deepEqual(actions, {
          name: common.appName,
          version: common.appVersion,
          platform: common.appPlatform
        });
        done();
      }
    };
    app.launched();
  });

  it('should attach the right protocol parameters for a `quit` event', function(done) {
    // mock function to intercept options
    var actions = {};
    var count = 0;
    app._send_ga = function(options) {
      assert.equal(options.hitType, 'event');
      assert.equal(options.eventCategory, 'App quit');
      actions[options.eventAction] = typeof options.eventValue !== 'undefined' ?
        options.eventValue : options.eventLabel;
      count ++;
      if (count === 5) {
        assert.deepEqual(actions, {
          name: this.appName,
          version: this.appVersion,
          platform: this.appPlatform,
          'exit code': 0,
          'minutes since start': 0
        });
        done();
      }
    };
    app.quit();
  });

  it('should attach the right protocol parameters for a `upgraded` event', function(done) {
    // mock function to intercept options
    var actions = {};
    var count = 0;
    app._send_ga = function(options) {
      assert.equal(options.hitType, 'event');
      assert.equal(options.eventCategory, 'App upgraded');
      actions[options.eventAction] = typeof options.eventValue !== 'undefined' ?
        options.eventValue : options.eventLabel;
      count ++;
      if (count === 4) {
        assert.deepEqual(actions, {
          name: this.appName,
          'previous version': '0.0.1',
          version: this.appVersion,
          platform: this.appPlatform
        });
        done();
      }
    };
    app.upgraded('0.0.1');
  });
});
