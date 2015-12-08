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
          // buildInfo is a separate function on the admin object
          buildInfo: function(callback) {
            return callback(err, res);
          },
          // all other commands return the global err/res results
          command: function(command, options, callback) {
            return callback(err, res);
          },
          databaseName: 'admin',
          // listCollections is a separate function on the admin object
          listCollections: function() {
            return {
              toArray: function(callback) {
                return callback(err, res);
              }
            };
          }
        };
      };
      db.db = function(databaseName) {
        return {
          databaseName: databaseName,
          listCollections: function() {
            return {
              toArray: function(callback) {
                return callback(err, res);
              }
            };
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
      results.userInfo = fixtures.USER_INFO_JOHN;
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
    var results = {};

    it('should return all databases for which the user can list collections', function(done) {
      results.userInfo = fixtures.USER_INFO_JOHN;

      fetch.getAllowedDatabases(function(err, res) {
        assert.equal(err, null);
        res.sort();
        assert.deepEqual(res, ['accounts', 'products', 'reporting', 'sales']);
        done();
      }, results);
    });

    it('should return empty list for users with no list collections', function(done) {
      results.userInfo = fixtures.USER_INFO_LISTDB_ONLY;

      fetch.getAllowedDatabases(function(err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      }, results);
    });
  });

  describe('getAllowedCollections', function() {
    var results = {};

    it('should return all collections the user info says it can access', function(done) {
      results.userInfo = fixtures.USER_INFO_JOHN;

      fetch.getAllowedCollections(function(err, res) {
        assert.equal(err, null);
        var expected = [
          {
            '_id': 'tenants.mongodb',
            'database': 'tenants',
            'name': 'mongodb'
          }
        ];
        assert.deepEqual(res, expected);
        done();
      }, results);
    });

    it('should return empty list for users with no collections', function(done) {
      results.userInfo = fixtures.USER_INFO_LISTDB_ONLY;

      fetch.getAllowedCollections(function(err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      }, results);
    });
  });

  describe('getDatabaseCollections', function() {
    var results = {};
    it('should ignore auth errors gracefully', function(done) {
      results.db = makeMockDB(new Error('not authorized on fooBarDatabase to execute command '
        + '{listCollections: true, filter: {}, cursor: {}'), null);

      fetch.getDatabaseCollections(results.db.admin(), function(err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      });
    });

    it('should pass on other errors from the listCollections command', function(done) {
      results.db = makeMockDB(new Error('some other error from list collections'), null);

      fetch.getDatabaseCollections(results.db.admin(), function(err, res) {
        assert.ok(err);
        assert.equal(err.command, 'listCollections');
        assert.deepEqual(res, null);
        done();
      });
    });
  });

  describe('listCollections', function() {
    var results = {};

    beforeEach(function() {
      results.databases = [
        {
          'name': 'accounts'
        },
        {
          'name': 'products'
        },
        {
          'name': 'reporting'
        },
        {
          'name': 'sales'
        }
      ];
    });

    it('should lists all collections for each listable db', function(done) {
      results.userInfo = fixtures.USER_INFO_JOHN;
      results.db = makeMockDB(null, [{
        'name': 'testCol'
      }]);

      fetch.listCollections(function(err, res) {
        assert.equal(err, null);
        res.sort();
        var expected = [
          {
            '_id': 'accounts.testCol',
            'database': 'accounts',
            'name': 'testCol'
          },
          {
            '_id': 'products.testCol',
            'database': 'products',
            'name': 'testCol'
          },
          {
            '_id': 'reporting.testCol',
            'database': 'reporting',
            'name': 'testCol'
          },
          {
            '_id': 'sales.testCol',
            'database': 'sales',
            'name': 'testCol'
          }
        ];
        expected.sort();
        assert.deepEqual(res, expected);
        done();
      }, results);
    });

    it('should be empty for no privileges', function(done) {
      results.userInfo = fixtures.USER_INFO_LISTDB_ONLY;
      results.db = makeMockDB(null, []);

      fetch.listCollections(function(err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      }, results);
    });
  });
});
