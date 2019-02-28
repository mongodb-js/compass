/* eslint no-console:0 */
var assert = require('assert');
var Connection = require('../');
var connect = Connection.connect;
var mock = require('mock-require');
var sinon = require('sinon');

function setupListeners() {}

// TODO: These instances are now turned off
var data = require('mongodb-connection-fixture');

describe('mongodb-connection#connect', function() {
  describe('local', function() {
    this.slow(2000);
    this.timeout(10000);
    before(require('mongodb-runner/mocha/before')({ port: 27018 }));
    after(require('mongodb-runner/mocha/after')({ port: 27018 }));
    it('should connect to `localhost:27018 with model`', function(done) {
      var model = Connection.from('mongodb://localhost:27018');
      connect(model, setupListeners, function(err) {
        assert.equal(err, null);
        done();
      });
    });
    it('should connect to `localhost:27018 with object`', function(done) {
      connect({port: 27018, host: 'localhost'}, setupListeners, function(err) {
        assert.equal(err, null);
        done();
      });
    });

    describe('ssh tunnel failures', function() {
      var spy = sinon.spy();
      mock('../lib/ssh-tunnel', function(model, cb) {
        // simulate successful tunnel creation
        cb();
        // then return a mocked tunnel object with a spy close() function
        return {close: spy};
      });

      var MockConnection = mock.reRequire('../lib/extended-model');
      var mockConnect = mock.reRequire('../lib/connect');

      it('should close ssh tunnel if the connection fails', function(done) {
        var model = new MockConnection({
          hostname: 'localhost',
          port: '27017',
          ssh_tunnel: 'USER_PASSWORD',
          ssh_tunnel_hostname: 'my.ssh-server.com',
          ssh_tunnel_password: 'password',
          ssh_tunnel_username: 'my-user'
        });
        assert(model.isValid());
        mockConnect(model, setupListeners, function(err) {
          // must throw error here, because the connection details are invalid
          assert.ok(err);
          assert.ok(/failed to connect to server/.test(err.message));
          // assert that tunnel.close() was called once
          assert.ok(spy.calledOnce);
          done();
        });
      });
    });
  });

  describe('cloud #slow', function() {
    this.slow(5000);
    this.timeout(10000);

    data.MATRIX.map(function(d) {
      it.skip('should connect to ' + d.name, function(done) {
        connect(d, setupListeners, function(err, _db) {
          if (err) {
            return done(err);
          }
          _db.close();
          done();
        });
      });
    });

    data.SSH_TUNNEL_MATRIX.map(function(d) {
      it.skip('connects via the ssh_tunnel to ' + d.ssh_tunnel_hostname, function(done) {
        connect(d, setupListeners, function(err, _db) {
          if (err) {
            return done(err);
          }
          _db.close();
          done();
        });
      });
    });
  });
});
