import assert from 'assert';
import asyncHooks from 'async_hooks';
import { expect } from 'chai';

import connectMongoClient from './connect-mongo-client';
import type { ConnectionOptions } from './connection-options';

const setupListeners = () => {
  //
};

describe('connectMongoClient', function () {
  let toBeClosed: { close: () => Promise<void> }[] = [];

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
        setupListeners
      );

      toBeClosed.push(client, tunnel);

      assert.strictEqual(url, 'mongodb://localhost:27018');

      assert.deepStrictEqual(options, {
        monitorCommands: true,
        useSystemCA: undefined,
      });
    });

    it('should not override a user-specified directConnection option', async function () {
      const [client, tunnel, { url, options }] = await connectMongoClient(
        {
          connectionString: 'mongodb://localhost:27018/?directConnection=false',
        },
        setupListeners
      );

      toBeClosed.push(client, tunnel);

      assert.strictEqual(
        url,
        'mongodb://localhost:27018/?directConnection=false'
      );

      assert.deepStrictEqual(options, {
        monitorCommands: true,
        useSystemCA: undefined,
      });
    });

    it('should at least try to run a ping command to verify connectivity', async function () {
      try {
        await connectMongoClient(
          {
            connectionString: 'mongodb://localhost:1/?loadBalanced=true',
          },
          setupListeners
        );
        expect.fail('missed exception');
      } catch (err: any) {
        expect(err.name).to.equal('MongoNetworkError');
      }
    });

    describe('ssh tunnel failures', function () {
      // Use async_hooks to track the state of the internal network server used
      // for SSH tunneling
      let asyncHook: ReturnType<typeof asyncHooks.createHook>;
      let resources: Array<{ asyncId: number; type: string; alive: boolean }>;

      beforeEach(function () {
        resources = [];
        asyncHook = asyncHooks.createHook({
          init(asyncId: number, type: string) {
            resources.push({ asyncId, type, alive: true });
          },
          destroy(asyncId: number) {
            const r = resources.find((r) => r.asyncId === asyncId);
            if (r) {
              r.alive = false;
            }
          },
        });
        asyncHook.enable();
      });

      afterEach(function () {
        asyncHook.disable();
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
          setupListeners
        ).catch((err) => err);

        expect(error).to.be.instanceOf(Error);

        // propagates the tunnel error
        expect(error.message).to.match(
          /(All configured authentication methods failed|ENOTFOUND compass-tests\.fakehost\.localhost)/
        );

        for (let i = 0; i < 10; i++) {
          // Give some time for the server to fully close + relay that status
          // to the async_hooks tracking
          await new Promise(setImmediate);
        }
        const networkServerStates = resources
          .filter(({ type }) => type === 'TCPSERVERWRAP')
          .map(({ alive }) => alive);
        expect(networkServerStates).to.deep.equal([false]);
      });
    });
  });
});
