var metrics = require('../lib')();
var resources = require('../lib/resources');
var assert = require('assert');
// var format = require('util').format;
var _ = require('lodash');
var common = require('./common');

// var debug = require('debug')('mongodb-js-metrics:test:mixpanel');

describe('Mixpanel Tracker', function() {
  var app;
  var user;
  var mixpanel;

  beforeEach(function() {
    // create metrics object and initialize
    metrics.configure('mixpanel', {
      apiToken: 'b61c82b6683a53688692fc2760cad5bd'
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

    mixpanel = metrics.trackers.get('mixpanel');
  });

  it('should only initialize after setting app and user resources', function() {
    assert.equal(mixpanel.mixpanelHandler, null);
    metrics.addResource(app);
    assert.equal(mixpanel.mixpanelHandler, null);
    metrics.addResource(user);
    // after call stack clears, mixpanelHandler should not be null anymore
    _.defer(function() {
      assert.ok(mixpanel.mixpanelHandler);
    });
  });
});
