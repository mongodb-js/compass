var assert = require('assert');
var fetch = require('../').fetch;
var fixtures = require('./fixtures');

// var debug = require('debug')('mongodb-instance-model:test:fetch-mocked');


describe('unit tests on fetch functions', function() {
  var makeMockDB;

  before(function() {
    /**
     * Create a mock db object that will return an error or a result on
     * any of its methods. Pass in either and error or a result, but not
     * both (just like regular Errbacks).
     *
     * @param  {Error|null} err    if the call should return an error, specify
     *                             the error object here.
     * @param  {Any} res           if the call should return a value, specify
     *                             the value here.
     * @return {Object}            a db object that behaves like the mongodb
     *                             driver
     */
    makeMockDB = function(err, res) {
      var db = {};
      db.admin = function() {
        return {
          // add more db methods here as needed.

          // buildInfo is a separate function on the admin object
          buildInfo: function(callback) {
            return callback(err, res);
          },
          // all other commands return the global err/res results
          command: function(command, options, callback) {
            return callback(err, res);
          }
        };
      };
      return db;
    };
  });

  describe('getBuildInfo', function() {
    it('should pass on any error that buildInfo returns', function(done) {
      // instead of the real db handle, pass in the mocked one
      var results = {
        // make a db that always returns error for db.admin().buildInfo()
        db: makeMockDB(new Error('some strange error'), null)
      };
      fetch.getBuildInfo(function(err, res) {
        assert.equal(res, null);
        assert.equal(err.command, 'buildInfo');
        assert.equal(err.message, 'some strange error');
        done();
      }, results);
    });
    it('should detect enterprise module correctly for 2.6 and 3.0', function(done) {
      var results = {
        db: makeMockDB(null, fixtures.BUILD_INFO_OLD)
      };
      fetch.getBuildInfo(function(err, res) {
        assert.equal(err, null);
        assert.equal(res.enterprise_module, true);
        done();
      }, results);
    });
    it('should detect enterprise module correctly for 3.2 +', function(done) {
      var results = {
        db: makeMockDB(null, fixtures.BUILD_INFO_3_2)
      };
      fetch.getBuildInfo(function(err, res) {
        assert.equal(err, null);
        assert.equal(res.enterprise_module, true);
        done();
      }, results);
    });
  });

  describe('getHostInfo', function() {
    it('should ignore auth errors gracefully', function(done) {
      // instead of the real db handle, pass in the mocked one
      var results = {
        db: makeMockDB(new Error('not authorized on fooBarDatabase to execute command '
          + '{listCollections: true, filter: {}, cursor: {}'), null)
      };
      fetch.getHostInfo(function(err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      }, results);
    });
    it('should pass on other errors from the hostInfo command', function(done) {
      // instead of the real db handle, pass in the mocked one
      var results = {
        db: makeMockDB(new Error('some other error from hostInfo'), null)
      };
      fetch.getHostInfo(function(err, res) {
        assert.ok(err);
        assert.equal(err.command, 'hostInfo');
        assert.deepEqual(res, null);
        done();
      }, results);
    });
  });

  describe('listDatabases', function() {
    var results = {};

    beforeEach(function() {
      results.userInfo = fixtures.USER_INFO;
    });

    it('should ignore auth errors gracefully', function(done) {
      // instead of the real db handle, pass in the mocked one
      results.db = makeMockDB(new Error('not authorized on admin to execute command '
        + '{ listDatabases: 1.0 }'), null);

      fetch.listDatabases(function(err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      }, results);
    });
    it('should pass on other errors from the listDatabases command', function(done) {
      // instead of the real db handle, pass in the mocked one
      results.db = makeMockDB(new Error('some other error from hostInfo'), null);

      fetch.listDatabases(function(err, res) {
        assert.ok(err);
        assert.equal(err.command, 'listDatabases');
        assert.deepEqual(res, null);
        done();
      }, results);
    });
  });

  describe('getAllowedDatabases', function() {
    it('should return the correct results');
    // ...
  });
  describe('getAllowedCollections', function() {
    it('should return the correct results');
    // ...
  });
  describe('getDatabaseCollections', function() {
    it('should ignore auth errors gracefully');
    it('should pass on other errors from the listCollections command');
    // ...
  });
  describe('listCollections', function() {
    it('should merge the two collection lists correctly');
    // ...
  });
});
