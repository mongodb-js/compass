const assert = require('assert');
const Connection = require('mongodb-connection-model');
const connect = Connection.connect;
const { getInstance } = require('../lib/instance-detail-helper');
const debug = require('debug')('mongodb-data-service:test:instance');

describe('mongodb-data-service#instance', function() {
  describe('local', function() {
    before(require('mongodb-runner/mocha/before')({
      port: 27018
    }));

    after(require('mongodb-runner/mocha/after')({
      port: 27018
    }));

    let client;
    let db;
    it('should connect to `localhost:27018`', function(done) {
      const model = Connection.from('mongodb://localhost:27018/data-service');
      connect(model, null, function(err, _client) {
        if (err) {
          return done(err);
        }
        client = _client;
        db = client.db('data-service');
        done();
      });
    });
    it('should not close the db after getting instance details', function(done) {
      assert(db);
      getInstance(client, db, function(err) {
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
    const connection = Connection.from('john:doe@localhost:30000/admin?authMechanism=MONGODB-CR');
    connect(connection, null, function(err, _client) {
      if (err) {
        return done(err);
      }
      getInstance(_client, _client.db('data-service'), function(_err, res) {
        if (_err) {
          return done(_err);
        }
        debug('instance details', JSON.stringify(res, null, 2));
        done();
      });
    });
  });
});
