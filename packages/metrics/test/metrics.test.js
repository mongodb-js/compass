var metrics = require('../lib')();
var resources = require('../lib/resources');
var assert = require('assert');
var pkg = require('../package.json');

// var debug = require('debug')('mongodb-js-metrics:test:metrics');

var DEBUG = true;

describe('metrics', function() {
  var app;
  var user;

  beforeEach(function() {
    // create a new app resource
    app = new resources.AppResource({
      appName: pkg.name,
      appVersion: pkg.version
    });

    // create a new user resource
    user = new resources.UserResource({
      userId: '121d91ad-15a4-47eb-977d-f279492932f0'
    });
  });

  it('should be a singleton and remember its state across requires', function() {
    metrics.addResource(app);
    assert.ok(metrics.trackers.get('ga').appName);

    var MetricsSingleton = require('../lib');
    var otherMetrics = new MetricsSingleton();
    assert.equal(metrics.trackers.get('ga'), otherMetrics.trackers.get('ga'));
    assert.equal(metrics.trackers.get('ga').appName, otherMetrics.trackers.get('ga').appName);
  });

  it('should be possible to add one or multiple resources at once', function() {
    metrics.addResource(app, user);
    assert.equal(metrics.resources.length, 2);

    metrics.resources.reset();
    metrics.addResource(user);
    assert.equal(metrics.resources.length, 1);
  });

  it('should be possible to configure single tracker and all at once', function() {
    metrics.configure('ga', {
      trackingId: 'foo-bar'
    });
    assert.equal(metrics.trackers.get('ga').trackingId, 'foo-bar');
    metrics.configure({
      ga: {
        trackingId: 'bar-baz'
      }
    });
    assert.equal(metrics.trackers.get('ga').trackingId, 'bar-baz');
  });

  it('should enable a tracker automatically when it is configured', function() {
    // reset the tracker to factory settings first (disables it)
    metrics.trackers.get('ga').clear();
    assert.ok(!metrics.trackers.get('ga').enabled);
    metrics.configure('ga', {
      trackingId: 'some-id'
    });
    assert.ok(metrics.trackers.get('ga').enabled);
  });

  describe('send hits to Google Analytics', function() {
    this.slow(1000);
    this.timeout(15000);

    before(function() {
      metrics.configure('ga', {
        debug: DEBUG,
        trackingId: 'UA-71150609-2'
      });
    });

    it('should send a google analytics App:launched event hit', function(done) {
      // add resources to tracker
      metrics.addResource(app);
      metrics.addResource(user);

      // send App/launched event
      metrics.track('App', 'launched', function(err, res) {
        assert.ifError(err);
        var resp = res.ga[0][0];
        assert.equal(resp.statusCode, 200);
        if (DEBUG) {
          var body = res.ga[0][1];
          assert.ok(JSON.parse(body).hitParsingResult[0].valid);
        }
        done();
      });
    });

    it('should send a google analytics User:login event hit', function(done) {
      // add resources to tracker
      metrics.addResource(app);
      metrics.addResource(user);

      metrics.track('User', 'login', function(err, res) {
        assert.ifError(err);
        var resp = res.ga[0][0];
        assert.equal(resp.statusCode, 200);
        if (DEBUG) {
          var body = res.ga[0][1];
          assert.ok(JSON.parse(body).hitParsingResult[0].valid);
        }
        done();
      });
    });

    it('should send a google analytics App:viewed screenview hit', function(done) {
      // add resource to tracker
      metrics.addResource(app);
      metrics.addResource(user);

      // send App/launched event
      metrics.track('App', 'viewed', 'Test Results', function(err, res) {
        assert.ifError(err);
        var resp = res.ga[0];
        assert.equal(resp.statusCode, 200);
        if (DEBUG) {
          var body = res.ga[1];
          assert.ok(JSON.parse(body).hitParsingResult[0].valid);
        }
        done();
      });
    });
  });
});
