import type { MongoClientOptions } from 'mongodb';
import { MongoClient } from 'mongodb';
import { connectMongoClient, hookLogger } from '@mongodb-js/devtools-connect';
import type { DevtoolsConnectOptions } from '@mongodb-js/devtools-connect';
import type SSHTunnel from '@mongodb-js/ssh-tunnel';
import EventEmitter from 'events';
import { redactConnectionOptions, redactConnectionString } from './redact';
import _ from 'lodash';

import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import type { ConnectionOptions } from './connection-options';
import {
  forceCloseTunnel,
  openSshTunnel,
  waitForTunnelError,
} from './ssh-tunnel';

const { debug, log } = createLoggerAndTelemetry('COMPASS-CONNECT');

export default async function connectMongoClientCompass(
  connectionOptions: Readonly<ConnectionOptions>,
  setupListeners: (client: MongoClient) => void
): Promise<
  [
    metadataClient: MongoClient,
    crudClient: MongoClient,
    sshTunnel: SSHTunnel | undefined,
    options: { url: string; options: DevtoolsConnectOptions }
  ]
> {
  debug(
    'connectMongoClient invoked',
    redactConnectionOptions(connectionOptions)
  );

  const url = connectionOptions.connectionString;
  const options: DevtoolsConnectOptions = {
    monitorCommands: true,
    useSystemCA: connectionOptions.useSystemCA,
    autoEncryption: connectionOptions.fleOptions?.autoEncryption,
  };

  if (options.autoEncryption && process.env.COMPASS_CSFLE_LIBRARY_PATH) {
    options.autoEncryption = {
      ...options.autoEncryption,
      extraOptions: {
        ...options.autoEncryption?.extraOptions,
        csflePath: process.env.COMPASS_CSFLE_LIBRARY_PATH,
      },
    };
  }

  // If connectionOptions.sshTunnel is defined, open an ssh tunnel.
  //
  // If connectionOptions.sshTunnel is not defined, the tunnel
  // will also be undefined.
  const [tunnel, socks5Options] = await openSshTunnel(
    connectionOptions.sshTunnel
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
  hookLogger(connectLogger, log.unbound, 'compass', redactConnectionString);

  async function connectSingleClient(
    overrideOptions: DevtoolsConnectOptions
  ): Promise<MongoClient> {
    const client = await connectMongoClient(
      url,
      // Deep clone because of https://jira.mongodb.org/browse/NODE-4124,
      // the options here are being mutated.
      _.cloneDeep({ ...options, ...overrideOptions }),
      connectLogger,
      CompassMongoClient
    );
    await client.db('admin').command({ ping: 1 });
    return client;
  }

  let metadataClient: MongoClient | undefined;
  let crudClient: MongoClient | undefined;
  try {
    debug('waiting for MongoClient to connect ...');
    // Create one or two clients, depending on whether CSFLE
    // is enabled. If it is, create one for interacting with
    // server metadata (e.g. build info, instance data, etc.)
    // and one for interacting with the actual CRUD data.
    // If CSFLE is disabled, use a single client for both cases.
    [metadataClient, crudClient] = await Promise.race([
      Promise.all([
        connectSingleClient({ autoEncryption: undefined }),
        options.autoEncryption ? connectSingleClient({}) : undefined,
      ]),
      waitForTunnelError(tunnel),
    ]); // waitForTunnel always throws, never resolves

    return [
      metadataClient,
      crudClient ?? metadataClient,
      tunnel,
      { url, options },
    ];
  } catch (err: any) {
    debug('connection error', err);
    debug('force shutting down ssh tunnel ...');
    await Promise.all([
      forceCloseTunnel(tunnel),
      crudClient?.close(),
      metadataClient?.close(),
    ]).catch(() => {
      /* ignore errors */
    });
    throw err;
  }
}
