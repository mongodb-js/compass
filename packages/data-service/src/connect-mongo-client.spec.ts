import assert from 'assert';
import asyncHooks from 'async_hooks';
import { expect } from 'chai';
import type { CommandStartedEvent } from 'mongodb';

import connectMongoClient from './connect-mongo-client';
import type { ConnectionOptions } from './connection-options';

const defaultOptions = {
  productDocsLink: 'https://www.mongodb.com/docs/compass/',
  productName: 'MongoDB Compass',
};

const setupListeners = () => {
  //
};

describe('connectMongoClient', function () {
  const toBeClosed = new Set<undefined | { close: () => Promise<void> }>();

  beforeEach(function () {
    toBeClosed.clear();
  });

  afterEach(async function () {
    for (const mongoClientOrTunnel of toBeClosed) {
      await mongoClientOrTunnel?.close();
    }
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
      const [metadataClient, crudClient, tunnel, { url, options }] =
        await connectMongoClient(
          {
            connectionString: 'mongodb://localhost:27018',
          },
          setupListeners
        );

      for (const closeLater of [metadataClient, crudClient, tunnel]) {
        toBeClosed.add(closeLater);
      }

      expect(metadataClient).to.equal(crudClient);
      expect(url).to.equal('mongodb://localhost:27018');

      expect(options).to.deep.equal({
        monitorCommands: true,
        useSystemCA: undefined,
        autoEncryption: undefined,
        ...defaultOptions,
      });
    });

    it('should return two different clients when AutoEncryption is enabled', async function () {
      const autoEncryption = {
        keyVaultNamespace: 'encryption.__keyVault',
        kmsProviders: {
          local: { key: Buffer.alloc(96) },
        },
        bypassAutoEncryption: true,
      };
      const [metadataClient, crudClient, tunnel, { url, options }] =
        await connectMongoClient(
          {
            connectionString: 'mongodb://localhost:27018',
            fleOptions: {
              storeCredentials: false,
              autoEncryption,
            },
          },
          setupListeners
        );

      for (const closeLater of [metadataClient, crudClient, tunnel]) {
        toBeClosed.add(closeLater);
      }

      expect(metadataClient).to.not.equal(crudClient);
      expect(metadataClient.options.autoEncryption).to.equal(undefined);
      expect(crudClient.options.autoEncryption).to.be.an('object');
      expect(url).to.equal('mongodb://localhost:27018');

      expect(options).to.deep.equal({
        monitorCommands: true,
        useSystemCA: undefined,
        autoEncryption,
        ...defaultOptions,
      });
    });

    it('should not override a user-specified directConnection option', async function () {
      const [metadataClient, crudClient, tunnel, { url, options }] =
        await connectMongoClient(
          {
            connectionString:
              'mongodb://localhost:27018/?directConnection=false',
          },
          setupListeners
        );

      for (const closeLater of [metadataClient, crudClient, tunnel]) {
        toBeClosed.add(closeLater);
      }

      assert.strictEqual(
        url,
        'mongodb://localhost:27018/?directConnection=false'
      );

      assert.deepStrictEqual(options, {
        monitorCommands: true,
        useSystemCA: undefined,
        autoEncryption: undefined,
        ...defaultOptions,
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

    it('should run the ping command with the specified ReadPreference', async function () {
      const commands: CommandStartedEvent[] = [];
      const [metadataClient, crudClient] = await connectMongoClient(
        {
          connectionString:
            'mongodb://localhost:27018/?readPreference=secondaryPreferred',
        },
        (client) => client.on('commandStarted', (ev) => commands.push(ev))
      );
      expect(commands).to.have.lengthOf(1);
      expect(commands[0].commandName).to.equal('ping');
      expect(commands[0].command.$readPreference).to.deep.equal({
        mode: 'secondaryPreferred',
      });

      for (const closeLater of [metadataClient, crudClient]) {
        toBeClosed.add(closeLater);
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
