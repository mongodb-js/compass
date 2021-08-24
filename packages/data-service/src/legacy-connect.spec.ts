/* eslint-disable mocha/no-setup-in-describe */
/* eslint no-console:0 */
import assert from 'assert';
import connect from './legacy-connect';
import mock from 'mock-require';
import sinon from 'sinon';
import SSHTunnel from '@mongodb-js/ssh-tunnel';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Connection = require('mongodb-connection-model');

const setupListeners = () => {
  //
};

describe('connection model connector', function () {
  describe('local', function () {
    if (process.env.EVERGREEN_BUILD_VARIANT === 'rhel') {
      // TODO: COMPASS-4866
      // eslint-disable-next-line no-console
      console.warn(
        'test suites using mongodb-runner are flaky on RHEL, skipping'
      );
      return;
    }

    it('should return connection config when connected successfully', function (done) {
      Connection.from('mongodb://localhost:27018', (parseErr, model) => {
        if (parseErr) throw parseErr;

        connect(
          model,
          setupListeners,
          (connectErr, client, _tunnel, { url, options }) => {
            if (connectErr) {
              return done(connectErr);
            }

            try {
              assert.strictEqual(
                url,
                'mongodb://localhost:27018/?readPreference=primary&directConnection=true&ssl=false'
              );

              assert.deepStrictEqual(options, {
                // this is never truly added at the moment since Connection.from
                // already adds this to the model and query string when necessary:
                // directConnection: true,
                readPreference: 'primary',
              });

              done();
            } catch (e) {
              done(e);
            } finally {
              if (client) {
                void client.close(true);
              }
            }
          }
        );
      });
    });

    it('should connect to `localhost:27018 with model`', function (done) {
      Connection.from('mongodb://localhost:27018', (parseErr, model) => {
        assert.equal(parseErr, null);
        connect(model, setupListeners, (connectErr, client) => {
          if (connectErr) {
            return done(connectErr);
          }

          void client.close(true);
          done();
        });
      });
    });

    it('should connect to `localhost:27018 with object`', function (done) {
      connect(
        new Connection({ port: 27018, host: 'localhost' }),
        setupListeners,
        (connectErr, client) => {
          if (connectErr) {
            return done(connectErr);
          }

          void client.close(true);
          done();
        }
      );
    });

    describe('ssh tunnel failures', function () {
      let closeSpy;

      mock('@mongodb-js/ssh-tunnel', {
        default: class MockTunnel extends SSHTunnel {
          constructor(...args) {
            super(...args);
            this.serverClose = closeSpy = sinon.spy(
              this.serverClose.bind(this)
            );
          }
        },
      });

      const MockConnection = mock.reRequire('mongodb-connection-model');
      const mockConnect = mock.reRequire('../lib/connect');

      it('should close ssh tunnel if the connection fails', function (done) {
        const model = new MockConnection({
          hostname: 'localhost',
          port: 27020,
          sshTunnel: 'USER_PASSWORD',
          sshTunnelHostname: 'my.ssh-server.com',
          sshTunnelPassword: 'password',
          sshTunnelUsername: 'my-user',
          extraOptions: { serverSelectionTimeoutMS: 100 },
        });

        assert(model.isValid());
        mockConnect(model, setupListeners, (err) => {
          try {
            // must throw error here, because the connection details are invalid
            assert.ok(err);
            // assert that tunnel.close() was called once
            assert.ok(
              closeSpy.calledOnce,
              'Expected tunnel.close to be called exactly once'
            );
            done();
          } catch (e) {
            done(e);
          }
        });
      });

      it('should propagate tunnel error if tunnel fails to connect', function (done) {
        const model = new MockConnection({
          hostname: 'localhost',
          port: 27020,
          sshTunnel: 'USER_PASSWORD',
          sshTunnelHostname: 'my.ssh-server.com',
          sshTunnelPassword: 'password',
          sshTunnelUsername: 'my-user',
          extraOptions: {
            serverSelectionTimeoutMS: 1000,
            socketTimeoutMS: 1000,
          },
        });

        assert(model.isValid());
        mockConnect(model, setupListeners, (err) => {
          try {
            const regex = /ENOTFOUND my.ssh-server.com/;

            assert.ok(err);
            assert.ok(
              regex.test(err.message),
              `Expected "${err.message}" to match ${regex}`
            );
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });

  /**
   * Originally `data` here was a `mongodb-connection-fixture` library export,
   * but none of the cloud services in the fixture are available anymore and
   * as such the library was removed and these tests are skipped
   */
  describe.skip('cloud #slow', function () {
    const data = { MATRIX: [], SSH_TUNNEL_MATRIX: [] };

    data.MATRIX.map((d) => {
      it.skip('should connect to ' + d.name, function (done) {
        connect(d, setupListeners, (err, client) => {
          if (err) {
            return done(err);
          }

          void client.close(true);
          done();
        });
      });
    });

    data.SSH_TUNNEL_MATRIX.map((d) => {
      it.skip(`connects via the sshTunnel to ${d.sshTunnelHostname}`, function (done) {
        connect(d, setupListeners, (err, client) => {
          if (err) {
            return done(err);
          }

          void client.close(true);
          done();
        });
      });
    });
  });
});
