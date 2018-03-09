var metrics = require('../lib')();
var resources = require('../lib/resources');
var assert = require('assert');
var common = require('./common');

// var debug = require('debug')('mongodb-js-metrics:test:stitch');

describe('Stitch Tracker', function() {
  var app;
  var user;
  var stitchTracker;

  beforeEach(function() {
    // create metrics object and initialize
    metrics.configure('stitch', {
      enabled: true,
      appId: 'compass-metrics-irinb',
      eventNamespace: 'metrics.events',
      userNamespace: 'metrics.users'
    });

    metrics.resources.reset();

    // create a new app resource
    app = new resources.AppResource({
      appName: common.appName,
      appVersion: common.appVersion,
      appPlatform: common.appPlatform
    });

    user = new resources.UserResource({
      userId: common.userId
    });

    stitchTracker = metrics.trackers.get('stitch');
  });

  afterEach(function() {
    stitchTracker.clear();
  });

  it('correctly sets enabledAndConfigured when props change', function() {
    stitchTracker.enabled = false;
    assert.ok(!stitchTracker.enabledAndConfigured);
    stitchTracker.enabled = true;
    assert.ok(stitchTracker.enabledAndConfigured);
  });

  it('should only initialize after setting app and user resources', function(done) {
    assert.equal(metrics.resources.length, 0);
    assert.equal(stitchTracker.enabledAndConfigured, false);
    metrics.addResource(app);
    metrics.addResource(user);
    // after call stack clears, stitchClient should not be null anymore
    setTimeout(function() {
      assert.ok(stitchTracker.appId);
      assert.ok(stitchTracker.userId);
      assert.ok(stitchTracker.enabledAndConfigured);
      done();
    });
  });
});
