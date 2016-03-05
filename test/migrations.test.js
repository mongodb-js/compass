var assert = require('assert');
var _ = require('lodash');
var debug = require('debug')('mongodb-compass:test:migrations');

var mockMigrations = {
  '0.9.1': function(previousVersion, currentVersion, cb) {
    debug('execute 0.9.1 migration');
    cb(null, '0.9.1');
  },
  '0.9.5': function(previousVersion, currentVersion, cb) {
    debug('execute 0.9.5 migration');
    cb(null, '0.9.5');
  },
  '1.0.4': function(previousVersion, currentVersion, cb) {
    debug('execute 1.0.4 migration');
    cb(null, '1.0.4');
  },
  '1.1.0': function(previousVersion, currentVersion, cb) {
    debug('execute 1.1.0 migration');
    cb(null, '1.1.0');
  },
  '1.2.1': function(previousVersion, currentVersion, cb) {
    debug('execute 1.2.1 migration');
    cb(null, '1.2.1');
  },
  '1.2.5': function(previousVersion, currentVersion, cb) {
    debug('execute 1.2.5 migration');
    cb(null, '1.2.5');
  }
};
/**
 * NOTE (imlucas) Tests won't run because localforage is not available?
 * We've switched to `electron-mocha` but still getting the following error:
 *
 *     ReferenceError: self is not defined
 *      at Object.<anonymous> (src/app/migrations/index.js:8:20)
 *      at Context.<anonymous> (test/migrations.test.js:35:15)
  */
describe.skip('Schema Migration', function() {
  var migrate;
  before(function() {
    migrate = require('../src/migrations');
  });

  it('should have the schema migration map', function() {
    assert.ok(migrate.migrations);
    assert.ok(_.isObject(migrate.migrations));
  });

  it('should have the schema migrate function', function() {
    assert.ok(migrate);
    assert.ok(_.isFunction(migrate));
  });

  describe('with mocked migrations', function() {
    before(function() {
      migrate.migrations = mockMigrations;
    });

    it('should contain the mocked migration versions', function() {
      assert.deepEqual(_.keys(migrate.migrations), ['0.9.1', '0.9.5', '1.0.4',
        '1.1.0', '1.2.1', '1.2.5']);
    });

    it('should not execute tasks if current version <= previous version', function(done) {
      migrate('1.0.0', '1.0.0', function(err, res) {
        assert.ifError(err);
        assert.deepEqual(res, {});
        done();
      });
    });

    it('should execute migrations between previous and current version', function(done) {
      migrate('1.0.0', '1.2.4', function(err, res) {
        debug('res, ', res);
        assert.ifError(err);
        assert.deepEqual(_.values(res), ['1.0.4', '1.1.0', '1.2.1']);
        done();
      });
    });

    it('should execute a migration for exactly the current version', function(done) {
      migrate('1.0.0', '1.0.4', function(err, res) {
        assert.ifError(err);
        assert.deepEqual(_.values(res), ['1.0.4']);
        done();
      });
    });

    it('should not execute a migration for exactly the previous version', function(done) {
      migrate('1.0.4', '1.0.7', function(err, res) {
        assert.ifError(err);
        assert.deepEqual(_.values(res), []);
        done();
      });
    });

    it('should not allow incompatible downgrades', function(done) {
      migrate('1.5.0', '1.0.0', function(err) {
        assert.ok(err);
        assert.ok(err.message.match(/Downgrade from version 1.5.0 to 1.0.0 not possible/));
        done();
      });
    });

    it('should allow compatible downgrades', function(done) {
      migrate('1.0.9', '1.0.5', function(err, res) {
        assert.ifError(err);
        assert.deepEqual(_.values(res), []);
        done();
      });
    });
  });
});
