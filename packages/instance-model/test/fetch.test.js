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
    // it('should list collections', function(done) {
    //   assert(db);
    //   fetch.getAllCollections(db, function(err, res) {
    //     if (err) {
    //       return done(err);
    //     }
    //     debug('list collections', JSON.stringify(res, null, 2));
    //     done();
    //   });
    // });
    //
    // it('should list databases', function(done) {
    //   assert(db);
    //   fetch.getDatabases(db, function(err, res) {
    //     if (err) {
    //       return done(err);
    //     }
    //     debug('list databases', JSON.stringify(res, null, 2));
    //     done();
    //   });
    // });
    //
    // it('should get build info', function(done) {
    //   assert(db);
    //   fetch.getBuildInfo(db, function(err, res) {
    //     if (err) {
    //       return done(err);
    //     }
    //     debug('build info', JSON.stringify(res, null, 2));
    //     done();
    //   });
    // });
    //
    // it('should get host info', function(done) {
    //   assert(db);
    //   fetch.getHostInfo(db, function(err, res) {
    //     if (err) {
    //       return done(err);
    //     }
    //     debug('host info', JSON.stringify(res, null, 2));
    //     done();
    //   });
    // });

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

              // it('should list databases', function(done) {
              //   if (process.env.dry ) {
              //     this.skip();
              //     return;
              //   }
              //   this.slow(5000);
              //   this.timeout(10000);
              //   assert(db, 'requires successful connection');
              //
              //   fetch.getDatabases(db, function(err, res) {
              //     if (err) return done(err);
              //
              //     assert(Array.isArray(res));
              //     assert(res.length > 0, 'Database list is empty');
              //     done();
              //   });
              // });
              //
              // it('should list collections', function(done) {
              //   if (process.env.dry ) {
              //     this.skip();
              //     return;
              //   }
              //   this.slow(5000);
              //   this.timeout(10000);
              //   assert(db, 'requires successful connection');
              //
              //   fetch.getAllCollections(db, function(err, res) {
              //     if (err) return done(err);
              //
              //     assert(Array.isArray(res));
              //     assert(res.length > 0, 'Collection list is empty');
              //     done();
              //   });
              // });


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
