var assert = require('assert');
var Connection = require('../');
var createSSHTunnel = require('../lib/ssh-tunnel');
var fs = require('fs');
var path = require('path');

describe('ssh_tunnel', function() {
  it.skip('should error when ssh fails', function(done) {
    var c = new Connection({
      hostname: '127.0.0.1',
      ssh_tunnel: 'USER_PASSWORD',
      ssh_tunnel_hostname: 'my.ssh-server.com',
      ssh_tunnel_username: 'my-user',
      ssh_tunnel_password: 'password'
    });

    var tunnel = createSSHTunnel(c, function(err) {
      if (err) {
        return done(err);
      }
      tunnel.test(function(_err) {
        if (!_err) {
          done(new Error('Should have failed to connect'));
        }
        done();
      });
    });
  });

  describe('ssh_tunnel_port', function() {
    it('should have the default value', function() {
      var c = new Connection();
      assert.equal(c.ssh_tunnel_port, 22);
    });

    it('should cast an empty string to the default', function() {
      var c = new Connection({
        ssh_tunnel_port: ''
      });

      assert.equal(c.ssh_tunnel_port, 22);
    });

    it('should cast an empty string to the default when updating', function() {
      var c = new Connection({});
      c.set({
        ssh_tunnel_port: ''
      });
      assert.equal(c.ssh_tunnel_port, 22);
    });

    it('should not allow negative numbers', function() {
      assert.throws(function() {
        /* eslint no-new:0 */
        new Connection({
          ssh_tunnel_port: -22
        });
      }, TypeError, /must be positive/);
    });

    it('should not allow values above the max port number value', function() {
      assert.throws(function() {
        /* eslint no-new:0 */
        new Connection({
          ssh_tunnel_port: 27017 * 10000
        });
      }, TypeError, /must be below/);
    });
  });

  describe('NONE', function() {
    var c = new Connection({
      hostname: '127.0.0.1',
      ssh_tunnel: 'NONE'
    });

    it('should be valid', function() {
      assert(c.isValid());
    });

    describe('ssh_tunnel_options', function() {
      it('should return an empty object', function() {
        assert.equal(c.ssh_tunnel_options.hostname, null);
      });
    });
  });

  describe('USER_PASSWORD', function() {
    it('should require `ssh_tunnel_hostname`', function() {
      var c = new Connection({
        ssh_tunnel: 'USER_PASSWORD',
        ssh_tunnel_port: 5000,
        ssh_tunnel_username: 'username',
        ssh_tunnel_password: 'password'
      });
      assert(!c.isValid());
    });

    it('should require `ssh_tunnel_username`', function() {
      var c = new Connection({
        ssh_tunnel: 'USER_PASSWORD',
        ssh_tunnel_hostname: '127.0.0.1',
        ssh_tunnel_port: 5000,
        ssh_tunnel_password: 'password'
      });
      assert(!c.isValid());
    });

    it('should require `ssh_tunnel_password`', function() {
      var c = new Connection({
        ssh_tunnel: 'USER_PASSWORD',
        ssh_tunnel_hostname: '127.0.0.1',
        ssh_tunnel_port: 5000,
        ssh_tunnel_username: 'username'
      });
      assert(!c.isValid());
    });

    var connection = new Connection({
      ssh_tunnel: 'USER_PASSWORD',
      ssh_tunnel_hostname: 'my.ssh-server.com',
      ssh_tunnel_username: 'my-user',
      hostname: 'mongodb.my-internal-host.com',
      port: 27000,
      ssh_tunnel_port: 3000,
      ssh_tunnel_password: 'password'
    });

    it('should be valid', function() {
      assert(connection.isValid());
    });

    describe('ssh_tunnel_options', function() {
      var options = connection.ssh_tunnel_options;

      it('maps ssh_tunnel_username -> username', function() {
        assert.equal(options.username, 'my-user');
      });

      it('maps ssh_tunnel_hostname -> host (jumpbox visible from localhost)', function() {
        assert.equal(options.host, 'my.ssh-server.com');
      });

      it('maps hostname -> dstAddr (mongod server address from jumpbox)', function() {
        assert.equal(options.dstAddr, 'mongodb.my-internal-host.com');
      });

      it('maps port -> dstPort (mongod server port)', function() {
        assert.equal(options.dstPort, 27000);
      });

      it('maps ssh_tunnel_port (remote sshd port) -> port', function() {
        assert.equal(options.port, 3000);
      });

      it('chooses a random localPort between 29170-29899', function() {
        assert.ok(options.localPort >= 29170, options.localPort);
        assert.ok(options.localPort <= 29899, options.localPort);
      });

      it('maps ssh_tunnel_password -> password', function() {
        assert.equal(options.password, 'password');
      });
    });
  });

  describe('IDENTITY_FILE', function() {
    it('triggers EISDIR error when calculating a derived property', function() {
      const connnectOptions = {
        ssh_tunnel: 'IDENTITY_FILE',
        // If we have an invalid identity directory
        ssh_tunnel_identity_file: '/path/to/.ssh/me.pub',
        ssh_tunnel_port: 5000,
        // And don't specify a derived property beforehand
        // ssh_tunnel_bind_to_local_port: 29555,
        ssh_tunnel_username: 'username'
      };
      assert.throws(() => { new Connection(connnectOptions); },
        /Error: EISDIR: illegal operation on a directory, read/
      );
    });

    it('should require `ssh_tunnel_hostname`', function() {
      var c = new Connection({
        ssh_tunnel: 'IDENTITY_FILE',
        ssh_tunnel_identity_file: '/path/to/.ssh/me.pub',
        ssh_tunnel_port: 5000,
        ssh_tunnel_bind_to_local_port: 29555,
        ssh_tunnel_username: 'username'
      });

      assert(!c.isValid());
    });

    it('should require `ssh_tunnel_username`', function() {
      var c = new Connection({
        ssh_tunnel: 'IDENTITY_FILE',
        ssh_tunnel_identity_file: '/path/to/.ssh/me.pub',
        ssh_tunnel_hostname: '127.0.0.1',
        ssh_tunnel_port: 5000,
        ssh_tunnel_bind_to_local_port: 29555,
        ssh_tunnel_passphrase: 'password'
      });
      assert(!c.isValid());
    });

    it('should require `ssh_tunnel_identity_file`', function() {
      var c = new Connection({
        ssh_tunnel: 'IDENTITY_FILE',
        ssh_tunnel_username: 'username',
        ssh_tunnel_hostname: '127.0.0.1',
        ssh_tunnel_port: 5000,
        ssh_tunnel_bind_to_local_port: 29555,
        ssh_tunnel_passphrase: 'password'
      });
      assert(!c.isValid());
    });

    describe('When `ssh_tunnel_passphrase` is provided', function() {
      var fileName = path.join(__dirname, 'fake-identity-file.txt');
      var connectionOptions = {
        ssh_tunnel: 'IDENTITY_FILE',
        ssh_tunnel_hostname: 'my.ssh-server.com',
        ssh_tunnel_username: 'my-user',
        ssh_tunnel_identity_file: [fileName],
        hostname: 'mongodb.my-internal-host.com',
        port: 27000,
        ssh_tunnel_port: 3000,
        ssh_tunnel_passphrase: 'passphrase'
      };
      var c = new Connection(connectionOptions);

      it('should be valid', function() {
        assert(c.isValid());
      });

      describe('ssh_tunnel_options', function() {
        var options = c.ssh_tunnel_options;

        it('maps ssh_tunnel_username -> username', function() {
          assert.equal(options.username, 'my-user');
        });

        it('maps ssh_tunnel_identity_file -> privateKey', function() {
          /* eslint no-sync: 0 */
          assert.equal(options.privateKey.toString(), fs.readFileSync(fileName).toString());
        });

        it('maps hostname -> host', function() {
          assert.equal(options.host, 'my.ssh-server.com');
        });

        it('maps ssh_tunnel_hostname -> host (jumpbox visible from localhost)', function() {
          assert.equal(options.host, 'my.ssh-server.com');
        });

        it('maps hostname -> dstAddr (mongod server address from jumpbox)', function() {
          assert.equal(options.dstAddr, 'mongodb.my-internal-host.com');
        });

        it('maps port -> dstPort (mongod server port)', function() {
          assert.equal(options.dstPort, 27000);
        });

        it('maps ssh_tunnel_port (remote sshd port) -> port', function() {
          assert.equal(options.port, 3000);
        });

        it('chooses a random localPort between 29170-29899', function() {
          assert.ok(options.localPort >= 29170, options.localPort);
          assert.ok(options.localPort <= 29899, options.localPort);
        });

        it('maps ssh_tunnel_passphrase -> passphrase', function() {
          assert.equal(options.passphrase, 'passphrase');
        });

        it('driver_url does not change after setting multiple options', function() {
          const driverUrl = c.driver_url;
          // I think we have to invalidate two levels of Ampersand cache here
          c.ssh_tunnel_passphrase = 'fooPASS';
          c.mongodb_username = 'admin';
          assert.equal(driverUrl, c.driver_url);
        });
      });
    });

    describe('When `ssh_tunnel_passphrase` is NOT provided', function() {
      var fileName = path.join(__dirname, 'fake-identity-file.txt');
      var c = new Connection({
        ssh_tunnel: 'IDENTITY_FILE',
        ssh_tunnel_hostname: 'my.ssh-server.com',
        ssh_tunnel_username: 'my-user',
        ssh_tunnel_identity_file: [fileName],
        hostname: 'mongodb.my-internal-host.com',
        port: 27000,
        ssh_tunnel_port: 3000
      });

      it('should be valid', function() {
        assert(c.isValid());
      });

      describe('ssh_tunnel_options', function() {
        var options = c.ssh_tunnel_options;

        it('maps ssh_tunnel_username -> username', function() {
          assert.equal(options.username, 'my-user');
        });

        it('maps ssh_tunnel_identity_file -> privateKey', function() {
          /* eslint no-sync: 0 */
          assert.equal(options.privateKey.toString(), fs.readFileSync(fileName).toString());
        });

        it('maps ssh_tunnel_hostname -> host (jumpbox visible from localhost)', function() {
          assert.equal(options.host, 'my.ssh-server.com');
        });

        it('maps hostname -> dstAddr (mongod server address from jumpbox)', function() {
          assert.equal(options.dstAddr, 'mongodb.my-internal-host.com');
        });

        it('maps port -> dstPort (mongod server port)', function() {
          assert.equal(options.dstPort, 27000);
        });

        it('maps ssh_tunnel_port (remote sshd port) -> port', function() {
          assert.equal(options.port, 3000);
        });

        it('chooses a random localPort between 29170-29899', function() {
          assert.ok(options.localPort >= 29170, options.localPort);
          assert.ok(options.localPort <= 29899, options.localPort);
        });
      });
    });
  });

  describe('#functional', function() {
    var setupListeners = function() {};
    describe('aws', function() {
      var identityFilePath = path.join(__dirname, 'aws-identity-file.pem');
      before(function(done) {
        if (!process.env.AWS_SSH_TUNNEL_IDENTITY_FILE) {
          return done();
        }
        fs.writeFile(identityFilePath, process.env.AWS_SSH_TUNNEL_IDENTITY_FILE, done);
      });

      after(function(done) {
        if (!process.env.AWS_SSH_TUNNEL_IDENTITY_FILE) {
          return done();
        }
        fs.unlink(identityFilePath, done);
      });

      it('should connect successfully', function(done) {
        if (!process.env.AWS_SSH_TUNNEL_HOSTNAME) {
          return this.skip('Set the `AWS_SSH_TUNNEL_HOSTNAME` environment variable');
        }
        if (!process.env.AWS_SSH_TUNNEL_IDENTITY_FILE) {
          return this.skip('Set the `AWS_SSH_TUNNEL_IDENTITY_FILE` environment variable');
        }

        var c = new Connection({
          ssh_tunnel: 'IDENTITY_FILE',
          ssh_tunnel_hostname: process.env.AWS_SSH_TUNNEL_HOSTNAME,
          ssh_tunnel_username: process.env.AWS_SSH_TUNNEL_USERNAME || 'ec2-user',
          ssh_tunnel_identity_file: [identityFilePath]
        });
        Connection.connect(c, setupListeners, done);
      });
    });
    describe('key formats', function() {
      it('should support pem');
      it('should support ppk');
      it('should error on unsupported formats');
    });
  });
});
