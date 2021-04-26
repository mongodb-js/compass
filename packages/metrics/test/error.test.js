var metrics = require('../lib')();
var resources = require('../lib/resources');
var assert = require('assert');
var sinon = require('sinon');

var debug = require('debug')('mongodb-js-metrics:test:error');
var DEBUG = true;

describe('Error Resource', function() {
  var errorResource;

  beforeEach(function() {
    // create metrics object and initialize
    metrics.configure('ga', {
      enabled: true,
      debug: DEBUG,
      trackingId: 'UA-71150609-2'
    });

    metrics.resources.reset();
    errorResource = new resources.ErrorResource();
    metrics.addResource(errorResource);
  });

  it('should have an id of `Error`', function() {
    assert.equal(errorResource.id, 'Error');
  });

  it('should be usable from the metrics module directly', function(done) {
    errorResource.error = function(err, metadata) {
      debug('arguments', arguments);
      assert.equal(err.message, 'foo bar');
      assert.equal(metadata.meta, 'data');
      done();
    };
    metrics.error(new Error('foo bar'), {meta: 'data'});
  });

  it('should send an exception hit type to ga', function(done) {
    errorResource._send_ga = function(options) {
      assert.equal(options.hitType, 'exception');
      assert.equal(options.exDescription, 'index.js:13 foo bar');
      assert.equal(options.exFatal, false);
      done();
    };
    var error = new Error('foo bar');
    error.lineno = 13;
    error.filename = 'index.js';
    errorResource.error(error);
  });

  it('should send an `Error` event to intercom', function(done) {
    errorResource._send_intercom = function(eventName, metadata) {
      assert.equal(metadata.message, 'foo bar');
      assert.equal(metadata.name, 'Error');
      assert.equal(metadata.lineno, 13);
      assert.ok(typeof metadata.stack === 'string');
      done();
    };
    var error = new Error('foo bar');
    error.lineno = 13;
    error.filename = 'index.js';
    errorResource.error(error);
  });

  describe('stitch error tracking', function() {
    it('should not send an `Error error` event to stitch when it is not present in the eventTrackers list', function() {
      errorResource._send_stitch = sinon.stub();
      var error = new Error('foo bar');
      error.lineno = 13;
      error.filename = 'index.js';
      errorResource.error(error);
      assert.ok(errorResource._send_stitch.notCalled);
    });

    it('should send an `Error error` event to stitch when it presents in eventTrackers list', function() {
      metrics.resources.reset();
      errorResource = new resources.ErrorResource({
        eventTrackers: ['ga', 'bugsnag', 'intercom', 'stitch']
      });
      metrics.addResource(errorResource);
      errorResource._send_stitch = function(eventName, metadata) {
        assert.equal(metadata.message, 'foo bar');
        assert.equal(metadata.name, 'Error');
        assert.equal(metadata.lineno, 13);
        assert.equal(eventName, 'Error error');
        assert.ok(typeof metadata.stack === 'string');
      };
      var error = new Error('foo bar');
      error.lineno = 13;
      error.filename = 'index.js';
      errorResource.error(error);
    });
  });

  it('should send an error to bugsnag', function(done) {
    var error = new Error('foo bar');
    errorResource._send_bugsnag = function(err) {
      assert.deepEqual(err, error);
      done();
    };
    errorResource.error(error);
  });

  it('should correctly extract the severity from the method name', function(done) {
    var error = new Error('foo bar');
    var bugsnagTracker = errorResource.trackers.get('bugsnag');
    /* eslint handle-callback-err: 0 */
    var oldSend = bugsnagTracker.send;
    bugsnagTracker.send = function(err, metadata, severity) {
      assert.equal(severity, 'info');
      bugsnagTracker.send = oldSend;
      done();
    };
    errorResource.info(error);
  });

  describe('send hits to Google Analytics', function() {
    it('should correctly validate against GA debug instance', function(done) {
      this.timeout(5000);
      var error = new Error('foo bar');
      // add userId here, usually comes from User resource
      metrics.error(error, {userId: '123'}, function(err, resp, body) {
        if (err) {
          done(err);
        }
        assert.equal(resp.statusCode, 200);
        if (DEBUG) {
          assert.ok(JSON.parse(body).hitParsingResult[0].valid);
        }
        done();
      });
    });
  });
});
