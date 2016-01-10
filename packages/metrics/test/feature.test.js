var metrics = require('../lib')();
var resources = require('../lib/resources');
var assert = require('assert');

// var debug = require('debug')('mongodb-js-metrics:test:feature');
var DEBUG = true;

describe('Feature Resource', function() {
  var feature;
  var PlasmaCannon;

  beforeEach(function() {
    // create metrics object and initialize
    metrics.configure({
      'ga': {
        debug: DEBUG,
        trackingId: 'UA-71150609-2'
      }
    });

    metrics.resources.reset();

    // create a new user resource
    PlasmaCannon = resources.FeatureResource.extend({
      id: 'Plasma Cannon'
    });

    feature = new PlasmaCannon();
  });

  it('should have `Plasma Cannon` as its id', function() {
    assert.equal(feature.id, 'Plasma Cannon');
  });

  it('should attach the right protocol parameters for a `used` event', function(done) {
    // mock function to intercept options
    feature._send_ga = function(options) {
      assert.equal(options.hitType, 'event');
      assert.equal(options.eventLabel, undefined);
      assert.equal(options.eventValue, undefined);
      assert.equal(options.eventCategory, 'Plasma Cannon');
      assert.equal(options.eventAction, 'used');
      done();
    };
    feature.used();
  });

  it('should be possible to rename the action', function(done) {
    PlasmaCannon = resources.FeatureResource.extend({
      id: 'Plasma Cannon',
      fired: function(metadata, callback) {
        metadata = metadata || {};
        metadata.action = 'fired';
        this.used.call(this, metadata, callback);
      }
    });
    feature = new PlasmaCannon();
    // mock function to intercept options
    feature._send_ga = function(options) {
      assert.equal(options.hitType, 'event');
      assert.equal(options.eventCategory, 'Plasma Cannon');
      assert.equal(options.eventAction, 'fired');
      done();
    };
    feature.fired();
  });
});
