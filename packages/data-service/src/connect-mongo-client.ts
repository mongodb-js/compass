import type { MongoClientOptions } from 'mongodb';
import { MongoClient } from 'mongodb';
import { connectMongoClient, hookLogger } from '@mongodb-js/devtools-connect';
import type { DevtoolsConnectOptions } from '@mongodb-js/devtools-connect';
import type SSHTunnel from '@mongodb-js/ssh-tunnel';
import EventEmitter from 'events';
import { redactConnectionOptions, redactConnectionString } from './redact';

import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import type { ConnectionOptions } from './connection-options';
import {
  forceCloseTunnel,
  openSshTunnel,
  waitForTunnelError,
} from './ssh-tunnel';

const { debug, log } = createLoggerAndTelemetry('COMPASS-CONNECT');

export default async function connectMongoClientCompass(
  connectionOptions: ConnectionOptions,
  setupListeners: (client: MongoClient) => void
): Promise<
  [
    MongoClient,
    SSHTunnel | undefined,
    { url: string; options: MongoClientOptions }
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
  };

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

  let mongoClient: MongoClient | undefined;
  try {
    debug('waiting for MongoClient to connect ...');
    mongoClient = await Promise.race([
      (async () => {
        const mongoClient = await connectMongoClient(
          url,
          options,
          connectLogger,
          CompassMongoClient
        );
        await mongoClient.db('admin').command({ ping: 1 });
        return mongoClient;
      })(),
      waitForTunnelError(tunnel),
    ]); // waitForTunnel always throws, never resolves

    return [mongoClient, tunnel, { url, options }];
  } catch (err: any) {
    debug('connection error', err);
    debug('force shutting down ssh tunnel ...');
    await Promise.all([forceCloseTunnel(tunnel), mongoClient?.close()]).catch(
      () => {
        /* ignore errors */
      }
    );
    throw err;
  }
}
