const assert = require('assert');
const Connection = require('../');
const createSSHTunnel = require('../lib/ssh-tunnel');
const fs = require('fs');
const path = require('path');

describe('sshTunnel', function() {
  it.skip('should error when ssh fails', (done) => {
    const c = new Connection({
      hostname: '127.0.0.1',
      sshTunnel: 'USER_PASSWORD',
      sshTunnelHostname: 'my.ssh-server.com',
      sshTunnelUsername: 'my-user',
      sshTunnelPassword: 'password'
    });

    const tunnel = createSSHTunnel(c, (err) => {
      if (err) {
        return done(err);
      }

      tunnel.test((_err) => {
        if (!_err) {
          done(new Error('Should have failed to connect'));
        }

        done();
      });
    });
  });

  describe('sshTunnelPort', () => {
    it('should have the default value', () => {
      const c = new Connection();

      assert.equal(c.sshTunnelPort, 22);
    });

    it('should cast an empty string to the default', () => {
      const c = new Connection({ sshTunnelPort: '' });

      assert.equal(c.sshTunnelPort, 22);
    });

    it('should cast an empty string to the default when updating', () => {
      const c = new Connection({});

      c.set({ sshTunnelPort: '' });
      assert.equal(c.sshTunnelPort, 22);
    });

    it('should not allow negative numbers', () => {
      assert.throws(() => {
        /* eslint no-new:0 */
        new Connection({ sshTunnelPort: -22 });
      }, TypeError, /must be positive/);
    });

    it('should not allow values above the max port number value', () => {
      assert.throws(() => {
        /* eslint no-new:0 */
        new Connection({ sshTunnelPort: 27017 * 10000 });
      }, TypeError, /must be below/);
    });
  });

  describe('NONE', () => {
    const c = new Connection({ hostname: '127.0.0.1', sshTunnel: 'NONE' });

    it('should be valid', () => {
      assert(c.isValid());
    });

    describe('sshTunnelOptions', () => {
      it('should return an empty object', () => {
        assert.equal(c.sshTunnelOptions.hostname, null);
      });
    });
  });

  describe('USER_PASSWORD', () => {
    it('should require `sshTunnelHostname`', () => {
      const c = new Connection({
        sshTunnel: 'USER_PASSWORD',
        sshTunnelPort: 5000,
        sshTunnelUsername: 'username',
        sshTunnelPassword: 'password'
      });

      assert(!c.isValid());
    });

    it('should require `sshTunnelUsername`', () => {
      const c = new Connection({
        sshTunnel: 'USER_PASSWORD',
        sshTunnelHostname: '127.0.0.1',
        sshTunnelPort: 5000,
        sshTunnelPassword: 'password'
      });

      assert(!c.isValid());
    });

    it('should require `sshTunnelPassword`', () => {
      const c = new Connection({
        sshTunnel: 'USER_PASSWORD',
        sshTunnelHostname: '127.0.0.1',
        sshTunnelPort: 5000,
        sshTunnelUsername: 'username'
      });

      assert(!c.isValid());
    });

    const connection = new Connection({
      sshTunnel: 'USER_PASSWORD',
      sshTunnelHostname: 'my.ssh-server.com',
      sshTunnelUsername: 'my-user',
      hostname: 'mongodb.my-internal-host.com',
      port: 27000,
      sshTunnelPort: 3000,
      sshTunnelPassword: 'password'
    });

    it('should be valid', () => {
      assert(connection.isValid());
    });

    describe('sshTunnelOptions', () => {
      const options = connection.sshTunnelOptions;

      it('maps sshTunnelUsername -> username', () => {
        assert.equal(options.username, 'my-user');
      });

      it('maps sshTunnelHostname -> host (jumpbox visible from localhost)', () => {
        assert.equal(options.host, 'my.ssh-server.com');
      });

      it('maps hostname -> dstAddr (mongod server address from jumpbox)', () => {
        assert.equal(options.dstAddr, 'mongodb.my-internal-host.com');
      });

      it('maps port -> dstPort (mongod server port)', () => {
        assert.equal(options.dstPort, 27000);
      });

      it('maps sshTunnelPort (remote sshd port) -> port', () => {
        assert.equal(options.port, 3000);
      });

      it('chooses a random localPort between 29170-29899', () => {
        assert.ok(options.localPort >= 29170, options.localPort);
        assert.ok(options.localPort <= 29899, options.localPort);
      });

      it('maps sshTunnelPassword -> password', () => {
        assert.equal(options.password, 'password');
      });
    });
  });

  describe('IDENTITY_FILE', () => {
    it('sets the private key to undefined', () => {
      const connnectOptions = {
        sshTunnel: 'IDENTITY_FILE',
        // If we have an invalid identity directory
        sshTunnelIdentityFile: ['/path/to/.ssh/me.pub'],
        sshTunnelPort: 5000,
        // And don't specify a derived property beforehand
        // sshTunnelBindToLocalPort: 29555,
        sshTunnelUsername: 'username'
      };

      assert.equal(new Connection(connnectOptions).sshTunnelOptions.privateKey, undefined);
    });

    it('should require `sshTunnelHostname`', () => {
      const c = new Connection({
        sshTunnel: 'IDENTITY_FILE',
        sshTunnelIdentityFile: '/path/to/.ssh/me.pub',
        sshTunnelPort: 5000,
        sshTunnelBindToLocalPort: 29555,
        sshTunnelUsername: 'username'
      });

      assert(!c.isValid());
    });

    it('should require `sshTunnelUsername`', () => {
      const c = new Connection({
        sshTunnel: 'IDENTITY_FILE',
        sshTunnelIdentityFile: '/path/to/.ssh/me.pub',
        sshTunnelHostname: '127.0.0.1',
        sshTunnelPort: 5000,
        sshTunnelBindToLocalPort: 29555,
        sshTunnelPassphrase: 'password'
      });

      assert(!c.isValid());
    });

    it('should require `sshTunnelIdentityFile`', () => {
      const c = new Connection({
        sshTunnel: 'IDENTITY_FILE',
        sshTunnelUsername: 'username',
        sshTunnelHostname: '127.0.0.1',
        sshTunnelPort: 5000,
        sshTunnelBindToLocalPort: 29555,
        sshTunnelPassphrase: 'password'
      });
      assert(!c.isValid());
    });

    describe('When `sshTunnelPassphrase` is provided', () => {
      const fileName = path.join(__dirname, 'fake-identity-file.txt');
      const connectionOptions = {
        sshTunnel: 'IDENTITY_FILE',
        sshTunnelHostname: 'my.ssh-server.com',
        sshTunnelUsername: 'my-user',
        sshTunnelIdentityFile: [fileName],
        hostname: 'mongodb.my-internal-host.com',
        port: 27000,
        sshTunnelPort: 3000,
        sshTunnelPassphrase: 'passphrase'
      };
      const c = new Connection(connectionOptions);

      it('should be valid', () => {
        assert(c.isValid());
      });

      describe('sshTunnelOptions', () => {
        const options = c.sshTunnelOptions;

        it('maps sshTunnelUsername -> username', () => {
          assert.equal(options.username, 'my-user');
        });

        it('maps sshTunnelIdentityFile -> privateKey', () => {
          /* eslint no-sync: 0 */
          assert.equal(options.privateKey.toString(), fs.readFileSync(fileName).toString());
        });

        it('maps hostname -> host', () => {
          assert.equal(options.host, 'my.ssh-server.com');
        });

        it('maps sshTunnelHostname -> host (jumpbox visible from localhost)', () => {
          assert.equal(options.host, 'my.ssh-server.com');
        });

        it('maps hostname -> dstAddr (mongod server address from jumpbox)', () => {
          assert.equal(options.dstAddr, 'mongodb.my-internal-host.com');
        });

        it('maps port -> dstPort (mongod server port)', () => {
          assert.equal(options.dstPort, 27000);
        });

        it('maps sshTunnelPort (remote sshd port) -> port', () => {
          assert.equal(options.port, 3000);
        });

        it('chooses a random localPort between 29170-29899', () => {
          assert.ok(options.localPort >= 29170, options.localPort);
          assert.ok(options.localPort <= 29899, options.localPort);
        });

        it('maps sshTunnelPassphrase -> passphrase', () => {
          assert.equal(options.passphrase, 'passphrase');
        });

        it('driverUrl does not change after setting multiple options', () => {
          const driverUrl = c.driverUrl;

          // I think we have to invalidate two levels of Ampersand cache here
          c.sshTunnelPassphrase = 'fooPASS';
          c.mongodbUsername = 'admin';
          assert.equal(driverUrl, c.driverUrl);
        });
      });
    });

    describe('When `sshTunnelPassphrase` is NOT provided', () => {
      const fileName = path.join(__dirname, 'fake-identity-file.txt');
      const c = new Connection({
        sshTunnel: 'IDENTITY_FILE',
        sshTunnelHostname: 'my.ssh-server.com',
        sshTunnelUsername: 'my-user',
        sshTunnelIdentityFile: [fileName],
        hostname: 'mongodb.my-internal-host.com',
        port: 27000,
        sshTunnelPort: 3000
      });

      it('should be valid', () => {
        assert(c.isValid());
      });

      it('should inject ssh tunnel port', (done) => {
        assert.equal(
          c.driverUrl,
          'mongodb://mongodb.my-internal-host.com:27000/?readPreference=primary&ssl=false'
        );

        Connection.from(c.driverUrlWithSsh, (error, sshModel) => {
          assert(!error);
          assert.equal(
            sshModel.hostname,
            '127.0.0.1'
          );
          assert.notEqual(
            c.port,
            sshModel.port
          );
          done();
        });
      });

      describe('sshTunnelOptions', () => {
        const options = c.sshTunnelOptions;

        it('maps sshTunnelUsername -> username', () => {
          assert.equal(options.username, 'my-user');
        });

        it('maps sshTunnelIdentityFile -> privateKey', () => {
          /* eslint no-sync: 0 */
          assert.equal(options.privateKey.toString(), fs.readFileSync(fileName).toString());
        });

        it('maps sshTunnelHostname -> host (jumpbox visible from localhost)', () => {
          assert.equal(options.host, 'my.ssh-server.com');
        });

        it('maps hostname -> dstAddr (mongod server address from jumpbox)', () => {
          assert.equal(options.dstAddr, 'mongodb.my-internal-host.com');
        });

        it('maps port -> dstPort (mongod server port)', () => {
          assert.equal(options.dstPort, 27000);
        });

        it('maps sshTunnelPort (remote sshd port) -> port', () => {
          assert.equal(options.port, 3000);
        });

        it('chooses a random localPort between 29170-29899', () => {
          assert.ok(options.localPort >= 29170, options.localPort);
          assert.ok(options.localPort <= 29899, options.localPort);
        });
      });
    });
  });

  describe('#functional', () => {
    const setupListeners = () => {};

    describe('aws', () => {
      const identityFilePath = path.join(__dirname, 'aws-identity-file.pem');

      before((done) => {
        if (!process.env.AWS_SSH_TUNNEL_IDENTITY_FILE) {
          return done();
        }

        fs.writeFile(identityFilePath, process.env.AWS_SSH_TUNNEL_IDENTITY_FILE, done);
      });

      after((done) => {
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

        const c = new Connection({
          sshTunnel: 'IDENTITY_FILE',
          sshTunnelHostname: process.env.AWS_SSH_TUNNEL_HOSTNAME,
          sshTunnelUsername: process.env.AWS_SSH_TUNNEL_USERNAME || 'ec2-user',
          sshTunnelIdentityFile: [identityFilePath]
        });

        Connection.connect(c, setupListeners, done);
      });
    });

    describe('key formats', () => {
      it('should support pem');
      it('should support ppk');
      it('should error on unsupported formats');
    });
  });
});
