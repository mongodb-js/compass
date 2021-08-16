const assert = require('assert');
const { ReadPreference } = require('mongodb');
const {
  getAllowedCollections,
  getAllowedDatabases,
  getBuildInfo,
  getCmdLineOpts,
  getDatabaseCollections,
  getGenuineMongoDB,
  getDataLake,
  getHostInfo,
  listCollections,
  listDatabases,
} = require('../lib/instance-detail-helper');
const fixtures = require('./fixtures');

// var debug = require('debug')('mongodb-data-service:test:instance-detail-helper-mocked');

describe('instance-detail-helper-mocked', function () {
  let makeMockDB;
  let makeMockClient;

  before(function () {
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
    makeMockDB = function (err, res) {
      const db = {};
      let times = 0;
      db.admin = function () {
        return {
          // all other commands return the global err/res results
          command: function (command, options, callback) {
            return typeof err === 'function'
              ? err(times++, command, options, callback)
              : callback(err, res);
          },
          databaseName: 'admin',
          // listCollections is a separate function on the admin object
          listCollections: function () {
            return {
              toArray: function (callback) {
                return callback(err, res);
              },
            };
          },
        };
      };
      return db;
    };

    makeMockClient = function (err, res) {
      const client = {};
      client.db = function (databaseName) {
        return {
          // all other commands return the global err/res results
          command: function (command, options, callback) {
            return callback(err, res);
          },
          databaseName: databaseName,
          // listCollections is a separate function on the admin object
          listCollections: function () {
            return {
              toArray: function (callback) {
                return callback(err, res);
              },
            };
          },
        };
      };
      return client;
    };
  });

  describe('getBuildInfo', function () {
    it('should pass on any error that buildInfo returns', function (done) {
      // instead of the real db handle, pass in the mocked one
      const results = {
        // make a db that always returns error for db.admin().buildInfo()
        db: makeMockDB(new Error('some strange error'), null),
      };
      getBuildInfo(results, function (err, res) {
        assert.equal(res, null);
        assert.equal(err.command, 'buildInfo');
        assert.equal(err.message, 'some strange error');
        done();
      });
    });
    it('should detect enterprise module correctly for 2.6 and 3.0', function (done) {
      const results = {
        db: makeMockDB(null, fixtures.BUILD_INFO_OLD),
      };
      getBuildInfo(results, function (err, res) {
        assert.equal(err, null);
        assert.equal(res.enterprise_module, true);
        done();
      });
    });
    it('should detect enterprise module correctly for 3.2 +', function (done) {
      const results = {
        db: makeMockDB(null, fixtures.BUILD_INFO_3_2),
      };
      getBuildInfo(results, function (err, res) {
        assert.equal(err, null);
        assert.equal(res.enterprise_module, true);
        done();
      });
    });
    it('should save a copy of the raw output', function (done) {
      const results = {
        db: makeMockDB(null, { tester: 1 }),
      };
      getBuildInfo(results, function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res.raw, { tester: 1 });
        done();
      });
    });
    it('should save the queryEngine field as null if it does not exist', function (done) {
      const results = {
        db: makeMockDB(null, { tester: 1 }),
      };
      getBuildInfo(results, function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res.queryEngine, null);
        done();
      });
    });
    it('should save the queryEngine field if it exists', function (done) {
      const results = {
        db: makeMockDB(null, { queryEngine: { version: '1' } }),
      };
      getBuildInfo(results, function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res.query_engine, { version: '1' });
        done();
      });
    });
    it('does not throw if buildInfo is missing properties', function (done) {
      // instead of the real db handle, pass in the mocked one
      const results = {
        db: makeMockDB(null, {}),
      };
      getBuildInfo(results, function (err, res) {
        try {
          assert.ok(!err);
          assert.deepEqual(res, {
            allocator: undefined,
            commit: undefined,
            commit_url: '',
            debug: undefined,
            enterprise_module: false,
            flags_compiler: undefined,
            flags_loader: undefined,
            for_bits: undefined,
            javascript_engine: undefined,
            max_bson_object_size: undefined,
            query_engine: null,
            raw: {},
            version: undefined,
          });
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
  describe('getCmdLineOpts', function () {
    it('should not pass on any error that getCmdLineOpts returns', function (done) {
      // instead of the real db handle, pass in the mocked one
      const results = {
        db: makeMockDB(new Error('some strange error'), null),
      };
      getCmdLineOpts(results, function (err, res) {
        assert.equal(err, null);
        assert.equal(res.errmsg, 'some strange error');
        done();
      });
    });
    it('should return results if they error but do not throw', function (done) {
      // instead of the real db handle, pass in the mocked one
      const results = {
        db: makeMockDB(null, fixtures.DOCUMENTDB_CMD_LINE_OPTS),
      };
      getCmdLineOpts(results, function (err, res) {
        assert.equal(err, null);
        assert.equal(res.errmsg, 'Feature not supported: getCmdLineOpts');
        done();
      });
    });
    it('should return results if no error', function (done) {
      const results = {
        db: makeMockDB(null, fixtures.CMD_LINE_OPTS),
      };
      getCmdLineOpts(results, function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, fixtures.CMD_LINE_OPTS);
        done();
      });
    });
  });

  describe('getGenuineMongoDB', function () {
    it('reports on CosmosDB', function (done) {
      const results = {
        build: { raw: fixtures.COSMOSDB_BUILD_INFO },
        cmdLineOpts: fixtures.CMD_LINE_OPTS,
      };
      getGenuineMongoDB(results, function (err, res) {
        assert.equal(err, null);
        assert.equal(res.dbType, 'cosmosdb');
        assert.equal(res.isGenuine, false);
        done();
      });
    });
    it('reports on DocumentDB', function (done) {
      const results = {
        build: { raw: fixtures.BUILD_INFO_3_2 },
        cmdLineOpts: fixtures.DOCUMENTDB_CMD_LINE_OPTS,
      };
      getGenuineMongoDB(results, function (err, res) {
        assert.equal(err, null);
        assert.equal(res.dbType, 'documentdb');
        assert.equal(res.isGenuine, false);
        done();
      });
    });
    it('should not report on 3.2', function (done) {
      const results = {
        build: { raw: fixtures.BUILD_INFO_3_2 },
        cmdLineOpts: fixtures.CMD_LINE_OPTS,
      };
      getGenuineMongoDB(results, function (err, res) {
        assert.equal(err, null);
        assert.equal(res.dbType, 'mongodb');
        assert.equal(res.isGenuine, true);
        done();
      });
    });
    it('should not report on older versions', function (done) {
      const results = {
        build: { raw: fixtures.BUILD_INFO_OLD },
        cmdLineOpts: fixtures.CMD_LINE_OPTS,
      };
      getGenuineMongoDB(results, function (err, res) {
        assert.equal(err, null);
        assert.equal(res.dbType, 'mongodb');
        assert.equal(res.isGenuine, true);
        done();
      });
    });
  });

  describe('getDataLake', function () {
    it('reports when connected to DataLake', function (done) {
      const results = {
        build: {
          raw: {
            dataLake: {
              version: 'v20200329',
              gitVersion: '0f318ss78bfad79ede3721e91iasj6f61644f',
              date: '2020-03-29T15:41:22Z',
            },
          },
        },
      };
      getDataLake(results, function (err, res) {
        assert.equal(err, null);
        assert.equal(res.isDataLake, true);
        assert.equal(res.version, 'v20200329');
        done();
      });
    });
    it('reports when not connected to DataLake and no queryEngine', function (done) {
      const results = {
        build: { raw: {} },
      };
      getDataLake(results, function (err, res) {
        assert.equal(err, null);
        assert.equal(res.isDataLake, false);
        assert.equal(res.version, null);
        done();
      });
    });
  });

  describe('getHostInfo', function () {
    it('should ignore auth errors gracefully', function (done) {
      // instead of the real db handle, pass in the mocked one
      const results = {
        db: makeMockDB(
          new Error(
            'not authorized on fooBarDatabase to execute command ' +
              '{listCollections: true, filter: {}, cursor: {}'
          ),
          null
        ),
      };
      getHostInfo(results, function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, {});
        done();
      });
    });
    it('should pass on other errors from the hostInfo command', function (done) {
      // instead of the real db handle, pass in the mocked one
      const results = {
        db: makeMockDB(new Error('some other error from hostInfo'), null),
      };
      getHostInfo(results, function (err, res) {
        assert.ok(err);
        assert.equal(err.command, 'hostInfo');
        assert.deepEqual(res, null);
        done();
      });
    });
    it('does not throw if hostInfo is missing properties', function (done) {
      // instead of the real db handle, pass in the mocked one
      const results = {
        db: makeMockDB(null, {}),
      };
      getHostInfo(results, function (err, res) {
        try {
          assert.ok(!err);
          assert.deepEqual(res, {
            arch: undefined,
            cpu_bits: undefined,
            cpu_cores: undefined,
            cpu_cores_physical: undefined,
            cpu_frequency: 0,
            cpu_scheduler: undefined,
            cpu_string: undefined,
            feature_always_full_sync: undefined,
            feature_nfs_async: undefined,
            feature_numa: undefined,
            hostname: 'unknown',
            kernel_version: undefined,
            kernel_version_string: undefined,
            machine_model: undefined,
            memory_bits: 0,
            memory_page_size: undefined,
            os: undefined,
            os_family: 'unknown',
            system_time: undefined,
          });
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
  describe('listDatabases', function () {
    const results = {};

    beforeEach(function () {
      results.userInfo = fixtures.USER_INFO_JOHN;
    });

    it('should ignore auth errors gracefully', function (done) {
      // instead of the real db handle, pass in the mocked one
      results.db = makeMockDB(function (times, command, options, callback) {
        if (command.listDatabases) {
          return callback(
            new Error(
              'not authorized on admin to execute command ' +
                '{ listDatabases: 1.0 }'
            ),
            null
          );
        }
        return callback(null, {});
      });

      listDatabases(results, function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      });
    });
    it('should pass the read preference explicity when it is set', function (done) {
      let passedOptions;
      results.db = makeMockDB(function (times, command, options, callback) {
        if (command.listDatabases) {
          passedOptions = options;
          return callback(null, { databases: [] });
        }
        return callback(null, {});
      });
      results.db.s = {
        readPreference: ReadPreference.SECONDARY,
      };

      listDatabases(results, function () {
        assert.deepEqual(passedOptions, {
          readPreference: 'secondary',
        });
        done();
      });
    });
    it('defaults to passing the read preference as PRIMARY', function (done) {
      let passedOptions;
      results.db = makeMockDB(function (times, command, options, callback) {
        if (command.listDatabases) {
          passedOptions = options;
          return callback(null, { databases: [] });
        }
        return callback(null, {});
      });

      listDatabases(results, function () {
        assert.deepEqual(passedOptions, {
          readPreference: ReadPreference.PRIMARY,
        });
        done();
      });
    });
    it('should pass on other errors from the listDatabases command', function (done) {
      // instead of the real db handle, pass in the mocked one
      results.db = makeMockDB(
        new Error('some other error from hostInfo'),
        null
      );

      listDatabases(results, function (err, res) {
        assert.ok(err);
        assert.equal(err.command, 'listDatabases');
        assert.deepEqual(res, null);
        done();
      });
    });
  });

  describe('getAllowedDatabases', function () {
    const results = {};

    it('should return all databases for which the user can list collections', function (done) {
      results.userInfo = fixtures.USER_INFO_JOHN;

      getAllowedDatabases(results, function (err, res) {
        assert.equal(err, null);
        res.sort();
        assert.deepEqual(res, [
          'accounts',
          'products',
          'reporting',
          'sales',
          'tenants',
        ]);
        done();
      });
    });

    it('should return empty list for users with no list collections', function (done) {
      results.userInfo = fixtures.USER_INFO_LISTDB_ONLY;

      getAllowedDatabases(results, function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      });
    });

    it('should return readable dbs for users with no list collections', function (done) {
      results.userInfo = fixtures.USER_INFO_COLL_ONLY;

      getAllowedDatabases(results, function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, ['db3']);
        done();
      });
    });
  });

  describe('getAllowedCollections', function () {
    const results = {};

    it('should return all collections the user info says it can access', function (done) {
      results.userInfo = fixtures.USER_INFO_JOHN;

      getAllowedCollections(results, function (err, res) {
        assert.equal(err, null);
        const expected = [
          {
            _id: 'tenants.mongodb',
            collation: null,
            database: 'tenants',
            name: 'mongodb',
            pipeline: undefined,
            readonly: false,
            type: 'collection',
            view_on: undefined,
          },
          {
            _id: 'reporting.system.indexes',
            database: 'reporting',
            name: 'system.indexes',
            pipeline: undefined,
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
          },
          {
            _id: 'reporting.system.js',
            database: 'reporting',
            name: 'system.js',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'reporting.system.namespaces',
            database: 'reporting',
            name: 'system.namespaces',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'products.system.indexes',
            database: 'products',
            name: 'system.indexes',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'products.system.js',
            database: 'products',
            name: 'system.js',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'products.system.namespaces',
            database: 'products',
            name: 'system.namespaces',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'sales.system.indexes',
            database: 'sales',
            name: 'system.indexes',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'sales.system.js',
            database: 'sales',
            name: 'system.js',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'sales.system.namespaces',
            database: 'sales',
            name: 'system.namespaces',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'accounts.system.indexes',
            database: 'accounts',
            name: 'system.indexes',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'accounts.system.js',
            database: 'accounts',
            name: 'system.js',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'accounts.system.namespaces',
            database: 'accounts',
            name: 'system.namespaces',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
        ];
        assert.deepEqual(res, expected);
        done();
      });
    });

    it('should return empty list for users with no collections', function (done) {
      results.userInfo = fixtures.USER_INFO_LISTDB_ONLY;

      getAllowedCollections(results, function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      });
    });

    it('should return readable collections for users with no list collections', function (done) {
      results.userInfo = fixtures.USER_INFO_COLL_ONLY;

      getAllowedCollections(results, function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, [
          {
            _id: 'db3.coll3',
            database: 'db3',
            name: 'coll3',
            readonly: false,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
        ]);
        done();
      });
    });
  });

  describe('getDatabaseCollections', function () {
    const results = {};
    it('should ignore auth errors gracefully', function (done) {
      results.db = makeMockDB(
        new Error(
          'not authorized on fooBarDatabase to execute command ' +
            '{listCollections: true, filter: {}, cursor: {}'
        ),
        null
      );

      getDatabaseCollections(results.db.admin(), function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      });
    });

    it('should pass on other errors from the listCollections command', function (done) {
      results.db = makeMockDB(
        new Error('some other error from list collections'),
        null
      );

      getDatabaseCollections(results.db.admin(), function (err, res) {
        assert.ok(err);
        assert.equal(err.command, 'listCollections');
        assert.deepEqual(res, null);
        done();
      });
    });
  });

  describe('listCollections', function () {
    const results = {};

    beforeEach(function () {
      results.databases = [
        {
          name: 'accounts',
        },
        {
          name: 'products',
        },
        {
          name: 'reporting',
        },
        {
          name: 'sales',
        },
      ];
    });

    it('should lists all collections for each listable db', function (done) {
      results.userInfo = fixtures.USER_INFO_JOHN;
      results.db = makeMockDB(null, [
        {
          name: 'testCol',
          info: {
            readOnly: true,
          },
        },
      ]);
      results.client = makeMockClient(null, [
        {
          name: 'testCol',
          info: {
            readOnly: true,
          },
        },
      ]);

      listCollections(results, function (err, res) {
        assert.equal(err, null);
        res.sort();
        const expected = [
          {
            _id: 'accounts.testCol',
            database: 'accounts',
            name: 'testCol',
            readonly: true,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'products.testCol',
            database: 'products',
            name: 'testCol',
            readonly: true,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'reporting.testCol',
            database: 'reporting',
            name: 'testCol',
            readonly: true,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
          {
            _id: 'sales.testCol',
            database: 'sales',
            name: 'testCol',
            readonly: true,
            collation: null,
            type: 'collection',
            view_on: undefined,
            pipeline: undefined,
          },
        ];
        expected.sort();
        assert.deepEqual(res, expected);
        done();
      });
    });

    it('should be empty for no privileges', function (done) {
      results.userInfo = fixtures.USER_INFO_LISTDB_ONLY;
      results.db = makeMockDB(null, []);
      results.client = makeMockClient(null, []);

      listCollections(results, function (err, res) {
        assert.equal(err, null);
        assert.deepEqual(res, []);
        done();
      });
    });
  });
});
