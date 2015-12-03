var _ = require('lodash');
var assert = require('assert');
var Connection = require('mongodb-connection-model');
var connect = Connection.connect;
var format = require('util').format;
var fetch = require('../').fetch;
var debug = require('debug')('mongodb-instance-model:test:fetch');

var fixtures = require('mongodb-connection-fixture').MATRIX.map(function(model) {
  return new Connection(model);
});
describe('mongodb-instance-model#fetch', function() {
  describe('local', function() {
    var db;
    before(require('mongodb-runner/mocha/before')());
    after(function() {
      if (db) {
        db.close();
      }
    });
    it('should connect to `localhost:27017`', function(done) {
      var model = Connection.from('mongodb://localhost:27017');
      connect(model, function(err, _db) {
        if (err) {
          return done(err);
        }
        db = _db;
        done();
      });
    });
    it('should get instance details', function(done) {
      assert(db);
      fetch(db, function(err, res) {
        if (err) {
          return done(err);
        }
        debug('instance details', JSON.stringify(res, null, 2));
        done();
      });
    });
    it('should not close the db after getting instance details', function(done) {
      assert(db);
      fetch(db, function(err) {
        if (err) {
          return done(err);
        }
        db.admin().ping(function(_err, pingResult) {
          if (_err) {
            done(_err);
          }
          done(null, pingResult);
        });
      });
    });
  });

  /**
   * @todo (imlucas) After mongodb-tools rewrite, http://npm.im/mongodb-runner
   * will be able to properly spin up deployments w authentication.
   */
  it.skip('should get instance details for john doe', function(done) {
    var connection = Connection.from('john:doe@localhost:30000/admin?authMechanism=MONGODB-CR');
    connect(connection, function(err, db) {
      if (err) {
        return done(err);
      }
      fetch(db, function(_err, res) {
        if (_err) {
          return done(_err);
        }
        debug('instance details', JSON.stringify(res, null, 2));
        done();
      });
    });
  });

  if (fixtures.length > 0) {
    describe('functional #slow', function() {
      _.map(_.groupBy(fixtures, 'authentication'), function(models, authentication) {
        describe(format('Using authentication `%s`', authentication), function() {
          _.each(models, function(model) {
            describe(model.name, function() {
              var db;
              it('should connect', function(done) {
                if (process.env.dry) {
                  this.skip();
                  return;
                }
                this.slow(5000);
                this.timeout(20000);

                connect(model, function(err, _db) {
                  if (err) {
                    return done(err);
                  }
                  db = _db;
                  done();
                });
              });
              it('should get instance details', function(done) {
                if (process.env.dry) {
                  this.skip();
                  return;
                }

                this.slow(5000);
                this.timeout(10000);
                assert(db, 'requires successful connection');
                fetch(db, function(err, res) {
                  debug('got instance details', res);
                  done(err, res);
                });
              });

              after(function() {
                if (db) {
                  db.close();
                }
              });
            });
          });
        });
      });
    });
  }
});
