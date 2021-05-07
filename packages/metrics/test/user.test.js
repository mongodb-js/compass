var uuid = require('uuid');
var metrics = require('../lib')();
var resources = require('../lib/resources');
var assert = require('assert');
var sinon = require('sinon');
var common = require('./common');

// var debug = require('debug')('mongodb-js-metrics:test:user');

var DEBUG = true;

describe('User Resource', function() {
  var user;

  beforeEach(function() {
    // create metrics object and initialize
    metrics.configure({
      ga: {
        enabled: true,
        debug: DEBUG,
        trackingId: 'UA-71150609-2'
      }
    });

    metrics.resources.reset();

    // create a new user resource
    user = new resources.UserResource({
      userId: common.userId
    });
  });

  it('should have `User` as its id', function() {
    assert.equal(user.id, 'User');
  });

  it('should have a `createdAt` field', function() {
    assert.ok(user.createdAt);
  });

  it('should have a userId after adding the user resource', function() {
    metrics.addResource(user);
    assert.equal(metrics.trackers.get('ga').userId, '121d91ad-15a4-47eb-977d-f279492932f0');
  });

  it('should update the userId when it changes on the user resource', function() {
    metrics.addResource(user);
    assert.equal(metrics.trackers.get('ga').userId, '121d91ad-15a4-47eb-977d-f279492932f0');
    user.userId = '3c007a83-e8c3-4b52-9631-b5fd97950dce';
    assert.equal(metrics.trackers.get('ga').userId, '3c007a83-e8c3-4b52-9631-b5fd97950dce');
  });

  it('should attach the right protocol parameters for a login event', function() {
    sinon.stub(uuid, 'v4').returns('test_event_id');
    // mock function to intercept options
    user._send_ga = sinon.stub();
    user._send_ga = function(options) {
      assert.equal(options.hitType, 'event');
      assert.equal(options.eventCategory, 'User');
      assert.equal(options.eventAction, 'login');
      assert.equal(options.eventLabel, 'test_event_id');
    };
    user.login();
    uuid.v4.restore();
  });
  it('should default twitter to `undefined`', function() {
    var u = new resources.UserResource({
      userId: common.userId
    });
    assert.equal(u.twitter, undefined);
  });
  it('should default email to `undefined`', function() {
    var u = new resources.UserResource({
      userId: common.userId
    });
    assert.equal(u.email, undefined);
  });
  it('should default name to `undefined`', function() {
    var u = new resources.UserResource({
      userId: common.userId
    });
    assert.equal(u.name, undefined);
  });
});
