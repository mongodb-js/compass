import assert from 'assert';
import { expect } from 'chai';
import getPort from 'get-port';
import net from 'net';

import connectMongoClient from './connect-mongo-client';
import { ConnectionOptions } from './connection-options';

const setupListeners = () => {
  //
};

const tryConnect = (port: number): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const socket = net.connect(port);

    socket
      .once('error', (err) => reject(err))
      .once('connect', () => {
        resolve();
        socket.destroy();
      });
  });

describe('connectMongoClient', function () {
  let toBeClosed: { close: () => Promise<void> }[] = [];

  let tunnelLocalPort: number;

  beforeEach(async function () {
    tunnelLocalPort = await getPort();
  });

  afterEach(async function () {
    for (const mongoClientOrTunnel of toBeClosed) {
      if (mongoClientOrTunnel) {
        await mongoClientOrTunnel.close();
      }
    }

    toBeClosed = [];
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
        setupListeners,
        tunnelLocalPort
      );

      toBeClosed.push(client, tunnel);

      assert.strictEqual(
        url,
        'mongodb://localhost:27018/?directConnection=true'
      );

      assert.deepStrictEqual(options, {
        monitorCommands: true,
      });
    });

    describe('ssh tunnel failures', function () {
      it('should refuse to open the tunnel with a replica set', async function () {
        const connectionOptions: ConnectionOptions = {
          connectionString:
            'mongodb://localhost:27018,localhost:27019,localhost:27020?serverSelectionTimeoutMS=100',
          sshTunnel: {
            host: 'localhost',
            port: 22,
            username: 'my-user',
            password: 'password',
          },
        };

        const error = await connectMongoClient(
          connectionOptions,
          setupListeners,
          tunnelLocalPort
        ).catch((err) => err);

        expect(error).to.be.instanceOf(Error);

        expect(error.message).to.match(
          /It is currently not possible to open an SSH tunnel to a replica set/
        );
      });

      it('should close ssh tunnel if the connection fails', async function () {
        const connectionOptions: ConnectionOptions = {
          connectionString:
            'mongodb://localhost:27020?serverSelectionTimeoutMS=100',
          sshTunnel: {
            host: 'compass-tests.fakehost.localhost',
            port: 22,
            username: 'my-user',
            password: 'password',
          },
        };

        const error = await connectMongoClient(
          connectionOptions,
          setupListeners,
          tunnelLocalPort
        ).catch((err) => err);

        expect(error).to.be.instanceOf(Error);

        // propagates the tunnel error
        expect(error.message).to.match(
          /(All configured authentication methods failed|ENOTFOUND compass-tests\.fakehost\.localhost)/
        );

        expect(
          (await tryConnect(tunnelLocalPort).catch((err) => err)).code
        ).to.equal('ECONNREFUSED');
      });
    });
  });
});
