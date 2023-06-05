import type { MongoClientOptions } from 'mongodb';
import { MongoClient } from 'mongodb';
import { connectMongoClient, hookLogger } from '@mongodb-js/devtools-connect';
import type {
  DevtoolsConnectOptions,
  DevtoolsConnectionState,
} from '@mongodb-js/devtools-connect';
import type SSHTunnel from '@mongodb-js/ssh-tunnel';
import EventEmitter from 'events';
import { redactConnectionOptions, redactConnectionString } from './redact';
import _ from 'lodash';
import type { ConnectionOptions } from './connection-options';
import {
  forceCloseTunnel,
  openSshTunnel,
  waitForTunnelError,
} from './ssh-tunnel';
import { runCommand } from './run-command';
import type { UnboundDataServiceImplLogger } from './logger';
import { debug as _debug } from './logger';

const debug = _debug.extend('compass-connect');

export const createClonedClient = Symbol('createClonedClient');
export type CloneableMongoClient = MongoClient & {
  [createClonedClient](): Promise<CloneableMongoClient>;
};

export function prepareOIDCOptions(
  connectionOptions: Readonly<ConnectionOptions>,
  signal?: AbortSignal
): Required<Pick<DevtoolsConnectOptions, 'oidc' | 'authMechanismProperties'>> {
  const options: Required<
    Pick<DevtoolsConnectOptions, 'oidc' | 'authMechanismProperties'>
  > = {
    oidc: { ...connectionOptions.oidc },
    authMechanismProperties: {},
  };

  options.oidc.allowedFlows ??= ['auth-code'];

  // Set the driver's `authMechanismProperties` (non-url)
  // `ALLOWED_HOSTS` value to `*`.
  if (connectionOptions.oidc?.enableUntrustedEndpoints) {
    options.authMechanismProperties.ALLOWED_HOSTS = ['*'];
  }

  // @ts-expect-error Will go away on @types/node update
  // with proper `AbortSignal` typings
  options.oidc.signal = signal;

  return options;
}

export async function connectMongoClientDataService({
  connectionOptions,
  setupListeners,
  signal,
  logger,
  productName,
  productDocsLink,
}: {
  connectionOptions: Readonly<ConnectionOptions>;
  setupListeners: (client: MongoClient) => void;
  signal?: AbortSignal;
  logger?: UnboundDataServiceImplLogger;
  productName?: string;
  productDocsLink?: string;
}): Promise<
  [
    metadataClient: CloneableMongoClient,
    crudClient: CloneableMongoClient,
    sshTunnel: SSHTunnel | undefined,
    connectionState: DevtoolsConnectionState,
    options: { url: string; options: DevtoolsConnectOptions }
  ]
> {
  debug(
    'connectMongoClient invoked',
    redactConnectionOptions(connectionOptions)
  );

  const oidcOptions = prepareOIDCOptions(connectionOptions, signal);

  const url = connectionOptions.connectionString;
  const options: DevtoolsConnectOptions = {
    productName: productName ?? 'MongoDB Compass',
    productDocsLink: productDocsLink ?? 'https://www.mongodb.com/docs/compass/',
    monitorCommands: true,
    useSystemCA: connectionOptions.useSystemCA,
    autoEncryption: connectionOptions.fleOptions?.autoEncryption,
    ...oidcOptions,
  };

  if (options.autoEncryption && process.env.COMPASS_CRYPT_LIBRARY_PATH) {
    options.autoEncryption = {
      ...options.autoEncryption,
      extraOptions: {
        ...options.autoEncryption?.extraOptions,
        cryptSharedLibPath: process.env.COMPASS_CRYPT_LIBRARY_PATH,
      },
    };
  }

  // If connectionOptions.sshTunnel is defined, open an ssh tunnel.
  //
  // If connectionOptions.sshTunnel is not defined, the tunnel
  // will also be undefined.
  const [tunnel, socks5Options] = await openSshTunnel(
    connectionOptions.sshTunnel,
    logger
  );

  if (socks5Options) {
    Object.assign(options, socks5Options);
  }
  class CompassMongoClient extends MongoClient {
    constructor(url: string, options?: MongoClientOptions) {
      super(url, options);
      if (setupListeners) {
        setupListeners(this);
      }
    }
  }

  const connectLogger = new EventEmitter();

  if (logger) {
    hookLogger(connectLogger, logger, 'compass', redactConnectionString);
  }

  async function connectSingleClient(
    overrideOptions: Partial<DevtoolsConnectOptions>
  ): Promise<{ client: CloneableMongoClient; state: DevtoolsConnectionState }> {
    // Deep clone because of https://jira.mongodb.org/browse/NODE-4124,
    // the options here are being mutated.
    const connectOptions = _.cloneDeep({ ...options, ...overrideOptions });
    const { client, state } = await connectMongoClient(
      url,
      connectOptions,
      connectLogger,
      CompassMongoClient
    );
    await runCommand(client.db('admin'), { ping: 1 });
    return {
      client: Object.assign(client, {
        async [createClonedClient]() {
          const { client } = await connectSingleClient({
            ...connectOptions,
            parentState: state,
          });
          return client;
        },
      }),
      state,
    };
  }

  let metadataClient: CloneableMongoClient | undefined;
  let crudClient: CloneableMongoClient | undefined;
  let state: DevtoolsConnectionState;
  try {
    debug('waiting for MongoClient to connect ...');
    // Create one or two clients, depending on whether CSFLE
    // is enabled. If it is, create one for interacting with
    // server metadata (e.g. build info, instance data, etc.)
    // and one for interacting with the actual CRUD data.
    // If CSFLE is disabled, use a single client for both cases.
    [metadataClient, crudClient, state] = await Promise.race([
      (async () => {
        const { client: metadataClient, state } = await connectSingleClient({
          autoEncryption: undefined,
        });
        const parentHandlePromise = state.getStateShareServer();
        parentHandlePromise.catch(() => {
          /* handled below */
        });
        let crudClient;

        // This used to happen in parallel, but since the introduction of OIDC connection
        // state needs to be shared and managed on the longest-lived client instance,
        // so we need to use the DevtoolsConnectionState instance created for the metadata
        // client here.
        if (options.autoEncryption) {
          try {
            crudClient = (
              await connectSingleClient({
                parentState: state,
              })
            ).client;
          } catch (err) {
            await metadataClient.close();
            throw err;
          }
        }

        try {
          // Make sure that if this failed, we clean up properly.
          await parentHandlePromise;
        } catch (err) {
          await metadataClient.close();
          await crudClient?.close();
          throw err;
        }

        // Return the parentHandle here so that it's included in the options that
        // are passed to compass-shell.
        return [metadataClient, crudClient, state] as const;
      })(),
      waitForTunnelError(tunnel),
    ]); // waitForTunnel always throws, never resolves

    options.parentHandle = await state.getStateShareServer();

    return [
      metadataClient,
      crudClient ?? metadataClient,
      tunnel,
      state,
      { url, options },
    ];
  } catch (err: any) {
    debug('connection error', err);
    debug('force shutting down ssh tunnel ...');
    await Promise.all([
      forceCloseTunnel(tunnel, logger),
      crudClient?.close(),
      metadataClient?.close(),
    ]).catch(() => {
      /* ignore errors */
    });
    throw err;
  }
}
