import assert from 'assert';
import asyncHooks from 'async_hooks';
import { expect } from 'chai';
import type { MongoClientOptions, CommandStartedEvent } from 'mongodb';

import {
  connectMongoClientDataService as connectMongoClient,
  prepareOIDCOptions,
} from './connect-mongo-client';
import type { ConnectionOptions } from './connection-options';
import { mochaTestServer } from '@mongodb-js/compass-test-server';
import ConnectionString from 'mongodb-connection-string-url';

const defaultOptions = {
  productDocsLink: 'https://www.mongodb.com/docs/compass/',
  productName: 'MongoDB Compass',
};

const setupListeners = () => {
  //
};

describe('connectMongoClient', function () {
  const cluster = mochaTestServer();
  let clusterConnectionStringURL: ConnectionString;

  before(function () {
    clusterConnectionStringURL = new ConnectionString(
      cluster().connectionString
    );
  });

  const toBeClosed = new Set<
    | undefined
    | { close: () => Promise<void> }
    | { destroy: () => Promise<void> }
  >();

  beforeEach(function () {
    toBeClosed.clear();
  });

  afterEach(async function () {
    for (const mongoClientOrTunnel of toBeClosed) {
      if (mongoClientOrTunnel && 'close' in mongoClientOrTunnel)
        await mongoClientOrTunnel.close();
      else await mongoClientOrTunnel?.destroy();
    }
  });

  describe('local', function () {
    it('should return connection config when connected successfully', async function () {
      const [metadataClient, crudClient, tunnel, state, { url, options }] =
        await connectMongoClient({
          connectionOptions: {
            connectionString: cluster().connectionString,
          },
          setupListeners,
        });

      for (const closeLater of [metadataClient, crudClient, tunnel, state]) {
        toBeClosed.add(closeLater);
      }

      expect(metadataClient).to.equal(crudClient);
      expect(url).to.equal(cluster().connectionString);

      expect(options.parentHandle).to.be.a('string');
      expect(options).to.deep.equal({
        monitorCommands: true,
        useSystemCA: undefined,
        authMechanismProperties: {},
        oidc: {
          allowedFlows: options.oidc?.allowedFlows,
          signal: undefined,
        },
        autoEncryption: undefined,
        parentHandle: options.parentHandle,
        ...defaultOptions,
      });
      expect(await (options.oidc?.allowedFlows as any)()).to.deep.equal([
        'auth-code',
      ]);
    });

    it('should return two different clients when AutoEncryption is enabled', async function () {
      const autoEncryption = {
        keyVaultNamespace: 'encryption.__keyVault',
        kmsProviders: {
          local: { key: Buffer.alloc(96) },
        },
        bypassAutoEncryption: true,
      };
      const [metadataClient, crudClient, tunnel, state, { url, options }] =
        await connectMongoClient({
          connectionOptions: {
            connectionString: cluster().connectionString,
            fleOptions: {
              storeCredentials: false,
              autoEncryption,
            },
          },
          setupListeners,
        });

      for (const closeLater of [metadataClient, crudClient, tunnel, state]) {
        toBeClosed.add(closeLater);
      }

      expect(metadataClient).to.not.equal(crudClient);
      expect(metadataClient.options.autoEncryption).to.equal(undefined);
      expect(crudClient.options.autoEncryption).to.be.an('object');
      expect(url).to.equal(cluster().connectionString);

      expect(options.parentHandle).to.be.a('string');
      expect(options).to.deep.equal({
        monitorCommands: true,
        useSystemCA: undefined,
        autoEncryption,
        authMechanismProperties: {},
        oidc: {
          allowedFlows: options.oidc?.allowedFlows,
          signal: undefined,
        },
        parentHandle: options.parentHandle,
        ...defaultOptions,
      });
      expect(await (options.oidc?.allowedFlows as any)()).to.deep.equal([
        'auth-code',
      ]);
    });

    it('should not override a user-specified directConnection option', async function () {
      const connectionString = clusterConnectionStringURL.clone();
      connectionString
        .typedSearchParams<MongoClientOptions>()
        .set('directConnection', 'false');
      const [metadataClient, crudClient, tunnel, state, { url, options }] =
        await connectMongoClient({
          connectionOptions: {
            connectionString: connectionString.toString(),
          },
          setupListeners,
        });

      for (const closeLater of [metadataClient, crudClient, tunnel, state]) {
        toBeClosed.add(closeLater);
      }

      assert.strictEqual(url, connectionString.toString());

      expect(options.parentHandle).to.be.a('string');
      expect(options).to.deep.equal({
        monitorCommands: true,
        useSystemCA: undefined,
        authMechanismProperties: {},
        oidc: {
          allowedFlows: options.oidc?.allowedFlows,
          signal: undefined,
        },
        autoEncryption: undefined,
        parentHandle: options.parentHandle,
        ...defaultOptions,
      });
      expect(await (options.oidc?.allowedFlows as any)()).to.deep.equal([
        'auth-code',
      ]);
    });

    it('should at least try to run a ping command to verify connectivity', async function () {
      try {
        await connectMongoClient({
          connectionOptions: {
            connectionString: 'mongodb://localhost:1/?loadBalanced=true',
          },
          setupListeners,
        });
        expect.fail('missed exception');
      } catch (err: any) {
        expect(err.name).to.equal('MongoNetworkError');
      }
    });

    it('should run the ping command with the specified ReadPreference', async function () {
      const connectionString = clusterConnectionStringURL.clone();
      connectionString
        .typedSearchParams<MongoClientOptions>()
        .set('readPreference', 'secondaryPreferred');
      const commands: CommandStartedEvent[] = [];
      const [metadataClient, crudClient, , state] = await connectMongoClient({
        connectionOptions: {
          connectionString: connectionString.toString(),
        },
        setupListeners: (client) =>
          client.on('commandStarted', (ev) => commands.push(ev)),
      });
      expect(commands).to.have.lengthOf(1);
      expect(commands[0].commandName).to.equal('ping');
      expect(commands[0].command.$readPreference).to.deep.equal({
        mode: 'secondaryPreferred',
      });

      for (const closeLater of [metadataClient, crudClient, state]) {
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

        const error = await connectMongoClient({
          connectionOptions,
          setupListeners,
        }).catch((err) => err);

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

// eslint-disable-next-line mocha/max-top-level-suites
describe('prepareOIDCOptions', function () {
  it('defaults allowedFlows to "auth-code"', async function () {
    const options = prepareOIDCOptions({
      connectionString: 'mongodb://localhost:27017',
    });

    expect(await (options.oidc.allowedFlows as any)()).to.deep.equal([
      'auth-code',
    ]);
  });

  it('does not override allowedFlows when set', async function () {
    const options = prepareOIDCOptions({
      connectionString: 'mongodb://localhost:27017',
      oidc: {
        allowedFlows: ['auth-code', 'device-auth'],
      },
    });
    expect(await (options.oidc.allowedFlows as any)()).to.deep.equal([
      'auth-code',
      'device-auth',
    ]);
  });

  it('maps ALLOWED_HOSTS on the authMechanismProperties (non-url) when enableUntrustedEndpoints is true', function () {
    function actual(connectionString: string) {
      return prepareOIDCOptions({
        connectionString,
        oidc: {
          enableUntrustedEndpoints: true,
        },
      }).authMechanismProperties;
    }

    function expected(ALLOWED_HOSTS: string[]) {
      return { ALLOWED_HOSTS };
    }

    expect(actual('mongodb://localhost/')).to.deep.equal(
      expected(['localhost'])
    );
    expect(actual('mongodb://localhost:27017/')).to.deep.equal(
      expected(['localhost'])
    );
    expect(actual('mongodb://localhost:12345/')).to.deep.equal(
      expected(['localhost'])
    );
    expect(actual('mongodb://localhost:12345,[::1]/')).to.deep.equal(
      expected(['localhost', '::1'])
    );
    expect(actual('mongodb://localhost,[::1]:999/')).to.deep.equal(
      expected(['localhost', '::1'])
    );
    expect(actual('mongodb://localhost,bar.foo.net/')).to.deep.equal(
      expected(['localhost', 'bar.foo.net'])
    );
    expect(actual('mongodb+srv://bar.foo.net/')).to.deep.equal(
      expected(['*.foo.net'])
    );
    expect(actual('mongodb://127.0.0.1:12345/')).to.deep.equal(
      expected(['127.0.0.1'])
    );
    expect(actual('mongodb://2130706433:12345/')).to.deep.equal(
      expected(['2130706433'])
    ); // decimal IPv4
  });

  it('does not set ALLOWED_HOSTS on the authMechanismProperties (non-url) when enableUntrustedEndpoints is not set', function () {
    const options = prepareOIDCOptions({
      connectionString: 'mongodb://localhost:27017',
    });

    expect(options.authMechanismProperties).to.deep.equal({});
  });

  it('passes through a signal argument', function () {
    const signal = AbortSignal.abort();
    const options = prepareOIDCOptions(
      {
        connectionString: 'mongodb://localhost:27017',
      },
      signal
    );

    expect(options.oidc.signal).to.equal(signal);
  });
});
