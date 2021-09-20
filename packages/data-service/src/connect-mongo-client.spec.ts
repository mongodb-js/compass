import SSHTunnel from '@mongodb-js/ssh-tunnel';
import assert from 'assert';
import sinon from 'sinon';
import { default as connectMongoClient } from './connect-mongo-client';
import { ConnectionOptions } from './connection-options';
import mock from 'mock-require';

const setupListeners = () => {
  //
};

describe('connection model connector', function () {
  let cleanUpQueue;

  afterEach(async function () {
    for (const [client, tunnel] of cleanUpQueue) {
      if (tunnel) {
        await tunnel.close();
      }
      if (client) {
        await client.close();
      }
    }

    cleanUpQueue = [];
  });

  describe('local', function () {
    before(function () {
      if (process.env.EVERGREEN_BUILD_VARIANT === 'rhel') {
        // TODO: COMPASS-4866
        console.warn(
          'test suites using mongodb-runner are flaky on RHEL, skipping'
        );
        return this.skip();
      }
    });

    it('should return connection config when connected successfully', async function () {
      const [client, tunnel, { url, options }] = await connectMongoClient(
        {
          connectionString: 'mongodb://localhost:27018',
        },
        setupListeners
      );

      cleanUpQueue.push([client, tunnel]);

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
    });

    describe('ssh tunnel failures', function () {
      let closeSpy: sinon.SinonSpy;
      let mockConnect;

      beforeEach(function () {
        mock(
          '@mongodb-js/ssh-tunnel',
          class MockTunnel extends SSHTunnel {
            constructor(...args: any[]) {
              super(...args);
              (this as any).serverClose = closeSpy = sinon.spy(
                (this as any).serverClose.bind(this)
              );
            }
          }
        );

        mockConnect = mock.reRequire('./connect-mongo-client')
          .default as unknown as typeof connectMongoClient;
      });

      it('should close ssh tunnel if the connection fails', async function () {
        const connectionOptions: ConnectionOptions = {
          connectionString:
            'mongodb://localhost:27020?serverSelectionTimeoutMS=100',
          sshTunnel: {
            host: 'my.ssh-server.com',
            port: 22,
            username: 'my-user',
            password: 'password',
          },
        };

        const error = await mockConnect(
          connectionOptions,
          setupListeners
        ).catch((err) => err);
        assert.ok(error instanceof Error);
        assert.ok(
          closeSpy.calledOnce,
          'Expected tunnel.close to be called exactly once'
        );
      });

      it('should propagate tunnel error if tunnel fails to connect', async function () {
        const connectionOptions: ConnectionOptions = {
          connectionString:
            'mongodb://localhost:27020?serverSelectionTimeoutMS=1000&socketTimeoutMS=1000',
          sshTunnel: {
            host: 'my.ssh-server.com',
            port: 22,
            username: 'my-user',
            password: 'password',
          },
        };

        const error = await mockConnect(
          connectionOptions,
          setupListeners
        ).catch((err) => err);

        assert.match(error.message, /ENOTFOUND my.ssh-server.com/);
      });
    });
  });
});
