var metrics = require('../lib')();
var resources = require('../lib/resources');
var assert = require('assert');
var common = require('./common');

// var debug = require('debug')('mongodb-js-metrics:test:user');

var DEBUG = true;

describe('User Resource', function() {
  var user;

  beforeEach(function() {
    // create metrics object and initialize
    metrics.configure({
      gaOptions: {
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

  it('should attach the right protocol parameters for a login event', function(done) {
    // mock function to intercept options
    user._send_ga = function(options) {
      assert.equal(options.hitType, 'event');
      assert.equal(options.eventCategory, 'User login');
      assert.equal(options.eventLabel, common.userId);
      done();
    };
    user.login();
  });
});
