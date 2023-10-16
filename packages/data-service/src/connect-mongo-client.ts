import type { MongoClientOptions } from 'mongodb';
import { MongoClient } from 'mongodb';
import { connectMongoClient, hookLogger } from '@mongodb-js/devtools-connect';
import type {
  DevtoolsConnectOptions,
  DevtoolsConnectionState,
} from '@mongodb-js/devtools-connect';
import type SSHTunnel from '@mongodb-js/ssh-tunnel';
import EventEmitter from 'events';
import ConnectionString from 'mongodb-connection-string-url';
import _ from 'lodash';

import { redactConnectionOptions, redactConnectionString } from './redact';
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

export type ReauthenticationHandler = () => PromiseLike<void> | void;

// Return an ALLOWED_HOSTS value that matches the hosts listed in the connection
// string, including possible SRV "sibling" domains.
function matchingAllowedHosts(
  connectionOptions: Readonly<ConnectionOptions>
): string[] {
  const connectionString = new ConnectionString(
    connectionOptions.connectionString,
    { looseValidation: true }
  );
  const suffixes = connectionString.hosts.map((hostStr) => {
    // eslint-disable-next-line
    const { host } = hostStr.match(/^(?<host>.+?)(?<port>:[^:\]\[]+)?$/)
      ?.groups!;
    if (host.startsWith('[') && host.endsWith(']')) {
      return host.slice(1, -1); // IPv6
    }
    if (host.match(/^[0-9.]+$/)) {
      return host; // IPv4
    }
    if (!host.includes('.') || !connectionString.isSRV) {
      return host;
    }
    // An SRV record for foo.bar.net can resolve to any hosts that match `*.bar.net`
    const parts = host.split('.');
    parts[0] = '*';
    return parts.join('.');
  });
  return [...new Set(suffixes)];
}

export function prepareOIDCOptions(
  connectionOptions: Readonly<ConnectionOptions>,
  signal?: AbortSignal,
  reauthenticationHandler?: ReauthenticationHandler
): Required<Pick<DevtoolsConnectOptions, 'oidc' | 'authMechanismProperties'>> {
  const options: Required<
    Pick<DevtoolsConnectOptions, 'oidc' | 'authMechanismProperties'>
  > = {
    oidc: { ...connectionOptions.oidc },
    authMechanismProperties: {},
  };

  const allowedFlows = connectionOptions.oidc?.allowedFlows ?? ['auth-code'];

  let isFirstAuthAttempt = true; // Don't need to prompt for re-auth on first attempt
  options.oidc.allowedFlows = async function () {
    if (!isFirstAuthAttempt) {
      await reauthenticationHandler?.();
    }
    isFirstAuthAttempt = false;
    return allowedFlows;
  };

  if (connectionOptions.oidc?.enableUntrustedEndpoints) {
    // Set the driver's `authMechanismProperties` (non-url) `ALLOWED_HOSTS` value
    // to match the connection string hosts, including possible SRV "sibling" domains.
    options.authMechanismProperties.ALLOWED_HOSTS =
      matchingAllowedHosts(connectionOptions);
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
  reauthenticationHandler,
}: {
  connectionOptions: Readonly<ConnectionOptions>;
  setupListeners: (client: MongoClient) => void;
  signal?: AbortSignal;
  logger?: UnboundDataServiceImplLogger;
  productName?: string;
  productDocsLink?: string;
  reauthenticationHandler?: ReauthenticationHandler;
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

  const oidcOptions = prepareOIDCOptions(
    connectionOptions,
    signal,
    reauthenticationHandler
  );

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
  const tunnelForwardingErrors: Error[] = [];
  tunnel?.on('forwardingError', (err: Error) =>
    tunnelForwardingErrors.push(err)
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
    if (tunnelForwardingErrors.length > 0) {
      err.message = `${
        err.message
      } [SSH Tunnel errors: ${tunnelForwardingErrors.map(
        (err) => err.message
      )}]`;
    }
    throw err;
  }
}
