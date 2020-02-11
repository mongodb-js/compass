var metrics = require('../lib')();
var resources = require('../lib/resources');
var assert = require('assert');
var sinon = require('sinon');
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
      events: 'metrics.events',
      users: 'metrics.users'
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

  afterEach(function(done) {
    stitchTracker.clear();
    stitchTracker.close();
    done();
  });

  it('correctly sets enabledAndConfigured when props change', function(done) {
    stitchTracker.enabled = false;
    assert.ok(!stitchTracker.enabledAndConfigured);
    stitchTracker.enabled = true;
    assert.ok(stitchTracker.enabledAndConfigured);
    done();
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

  it('should add getCollection function call to the queue when stitch client is not ready', function() {
    metrics.addResource(app);
    metrics.addResource(user);
    assert.ok(!stitchTracker._isTrackerReady());
    assert.equal(stitchTracker._callsQueue.length, 0);
    stitchTracker.send('User login', { 'event id': 1 });
    assert.ok(stitchTracker._callsQueue.length, 1);
  });

  describe('trackFromQueue', function() {
    it('should call fn with provided arguments from the queue', function() {
      var fnSpy = sinon.spy();
      stitchTracker._callsQueue = [
        {
          fn: fnSpy,
          args: ['mongod', 'user']
        }
      ];
      stitchTracker._trackFromQueue();
      assert.ok(fnSpy.calledWith('mongod', 'user'));
    });
  });

  describe('_enabledConfiguredChanged', function() {
    var trackFromQueueStub;
    var identifyStub;
    var setupStub;

    beforeEach(function() {
      metrics.addResource(app);
      metrics.addResource(user);
      trackFromQueueStub = sinon.stub(stitchTracker, '_trackFromQueue');
      identifyStub = sinon.stub(stitchTracker, '_identify');
      setupStub = sinon
        .stub(stitchTracker, '_setup')
        .returns(Promise.resolve({}));
    });

    afterEach(function() {
      trackFromQueueStub.restore();
      identifyStub.restore();
      setupStub.restore();
    });

    it('should call _setup for setting stitch client', function() {
      stitchTracker._enabledConfiguredChanged();
      assert.ok(setupStub.calledOnce);
    });

    it('should track all events from _callsQueue only when tracker has been initialized', function() {
      stitchTracker._enabledConfiguredChanged();
      return setupStub().then(function() {
        assert.ok(trackFromQueueStub.called);
      });
    });

    it('should call _identify only when tracker has been initialized', function() {
      stitchTracker._enabledConfiguredChanged();
      return setupStub().then(function() {
        assert.ok(identifyStub.called);
      });
    });
  });

  describe('optional users collection', function() {
    var _getCollectionStub;
    var setupStub;

    beforeEach(function() {
      metrics.addResource(app);
      metrics.addResource(user);
      _getCollectionStub = sinon.stub(stitchTracker, '_getCollection');
      setupStub = sinon
        .stub(stitchTracker, '_setup')
        .returns(Promise.resolve({}));
    });

    afterEach(function() {
      _getCollectionStub.restore();
      setupStub.restore();
    });

    it('should only send to the users collection when this.users is specified', function() {
      stitchTracker._enabledConfiguredChanged();
      return setupStub().then(function() {
        assert.ok(_getCollectionStub.called);
      });
    });

    it('should not send to the users collection when this.users is falsey', function() {
      stitchTracker.users = null;
      stitchTracker._enabledConfiguredChanged();
      return setupStub().then(function() {
        assert.ok(!_getCollectionStub.called);
      });
    });
  });
});
