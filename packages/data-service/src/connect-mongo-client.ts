import type { MongoClientOptions } from 'mongodb';
import { MongoClient } from 'mongodb';
import { connectMongoClient, hookLogger } from '@mongodb-js/devtools-connect';
import type { DevtoolsConnectOptions } from '@mongodb-js/devtools-connect';
import type SSHTunnel from '@mongodb-js/ssh-tunnel';
import EventEmitter from 'events';
import { redactConnectionOptions, redactConnectionString } from './redact';
import _ from 'lodash';
import { promises as fs } from 'fs';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import type { ConnectionOptions } from './connection-options';
import {
  forceCloseTunnel,
  openSshTunnel,
  waitForTunnelError,
} from './ssh-tunnel';
import ConnectionString from 'mongodb-connection-string-url';

const { debug, log } = createLoggerAndTelemetry('COMPASS-CONNECT');

export const createClonedClient = Symbol('createClonedClient');
export type CloneableMongoClient = MongoClient & {
  [createClonedClient](): Promise<CloneableMongoClient>;
};

export default async function connectMongoClientCompass(
  connectionOptions: Readonly<ConnectionOptions>,
  setupListeners: (client: MongoClient) => void
): Promise<
  [
    metadataClient: CloneableMongoClient,
    crudClient: CloneableMongoClient,
    sshTunnel: SSHTunnel | undefined,
    options: { url: string; options: DevtoolsConnectOptions }
  ]
> {
  debug(
    'connectMongoClient invoked',
    redactConnectionOptions(connectionOptions)
  );

  console.log({connectionOptions});

  const url = connectionOptions.connectionString;
  const options: DevtoolsConnectOptions = {
    monitorCommands: true,
    useSystemCA: connectionOptions.useSystemCA,
    autoEncryption: connectionOptions.fleOptions?.autoEncryption,
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
  ): Promise<CloneableMongoClient> {
    // Deep clone because of https://jira.mongodb.org/browse/NODE-4124,
    // the options here are being mutated.
    const connectOptions = _.cloneDeep({ ...options, ...overrideOptions });

    const _url = new ConnectionString(url);

    const requiresReadFileOptions: DevtoolsConnectOptions = {};

    const optionsMap = {
      sslCA: 'ca',
      // sslCRT: 'crl',
      sslCert: 'cert',
      sslKey: 'key',
      tlsCAFile: 'ca',
      tlsCertificateFile: 'cert',
      tlsCertificateKeyFile: 'key',
    } as const;

    const searchParams = _url.typedSearchParams<DevtoolsConnectOptions>();

    // Something driver does when file paths are passed to the MongoClient
    if (searchParams.has('tlsCertificateKeyFile') && !searchParams.has('tlsCertificateFile')) {
      searchParams.set(
        'tlsCertificateFile',
        searchParams.get('tlsCertificateKeyFile')
      );
    }

    for (const key of Object.keys(optionsMap) as (keyof typeof optionsMap)[]) {
      if (_url.typedSearchParams<DevtoolsConnectOptions>().has(key)) {
        const file = searchParams.get(key);
        if (file) {
          // mongodb-browser can't use fs, so we are doing the conversion that
          // driver usually handles on its own to handle that case
          requiresReadFileOptions[optionsMap[key]] = await fs.readFile(
            file,
            'ascii'
          );
        }
        searchParams.delete(key);
      }
    }

    console.log(_url.toString(), {
      ...connectOptions,
      ...requiresReadFileOptions,
    });

    const client = await connectMongoClient(
      _url.toString(),
      { ...connectOptions, ...requiresReadFileOptions },
      connectLogger,
      CompassMongoClient
    );
    await client.db('admin').command({ ping: 1 });
    return Object.assign(client, {
      async [createClonedClient]() {
        return await connectSingleClient(connectOptions);
      },
    });
  }

  let metadataClient: CloneableMongoClient | undefined;
  let crudClient: CloneableMongoClient | undefined;
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
