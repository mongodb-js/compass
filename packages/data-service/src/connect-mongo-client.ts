import { MongoClientOptions, MongoClient } from 'mongodb';
import SSHTunnel from '@mongodb-js/ssh-tunnel';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import resolveMongodbSrv from 'resolve-mongodb-srv';
import { redactConnectionOptions, redactConnectionString } from './redact';

import createLogger from '@mongodb-js/compass-logging';
import { ConnectionOptions } from './connection-options';
import {
  forceCloseTunnel,
  openSshTunnel,
  waitForTunnelError,
} from './ssh-tunnel';

const { debug, log, mongoLogId } = createLogger('COMPASS-CONNECT');

export default async function connectMongoClient(
  connectionOptions: ConnectionOptions,
  setupListeners: (client: MongoClient) => void,
  tunnelLocalPort: number
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

  const [driverUrl, driverOptions] =
    connectionOptionsToMongoClientParams(connectionOptions);

  // While the driver also performs SRV record resolution as part
  // of its connection step, this gives us the ability to log the
  // before/after state, and is needed to get a destination host
  // for SSH tunnel.
  // Also we may very well need to do our own
  // SRV record resolution as part of
  // https://jira.mongodb.org/browse/COMPASS-4768 anyway.
  const srvResolvedUrl = await resolveSrvRecord(driverUrl);

  // If connectionOptions.sshTunnel is defined opens an ssh tunnel and returns
  // the tunnel and the new local MongoClient connectionString.
  //
  // If connectionOptions.sshTunnel is not defined the tunnel
  // will also be undefined and the connectionString will be the
  // same as the one passed as argument.
  const [tunnel, socks5Options] = await openSshTunnel(
    srvResolvedUrl,
    connectionOptions.sshTunnel,
    tunnelLocalPort
  );

  if (socks5Options) {
    driverOptions.socks5Options = socks5Options;
  }

  log.info(mongoLogId(1_001_000_009), 'Connect', 'Initiating connection', {
    url: redactConnectionString(srvResolvedUrl),
    options: driverOptions,
  });

  const mongoClient = new MongoClient(srvResolvedUrl, driverOptions);

  if (setupListeners) {
    setupListeners(mongoClient);
  }

  try {
    debug('waiting for MongoClient to connect ...');
    const client = (await Promise.race([
      mongoClient.connect(),
      waitForTunnelError(tunnel),
    ])) as MongoClient; // waitForTunnel always throws, never resolves

    log.info(mongoLogId(1_001_000_012), 'Connect', 'Connection established', {
      driver: mongoClient.options?.metadata?.driver,
      url: redactConnectionString(srvResolvedUrl),
    });

    return [client, tunnel, { url: srvResolvedUrl, options: driverOptions }];
  } catch (err: any) {
    log.error(
      mongoLogId(1_001_000_013),
      'Connect',
      'Connection attempt failed',
      { error: err.message }
    );
    debug('connection error', err);
    debug('force shutting down ssh tunnel ...');
    await forceCloseTunnel(tunnel);
    throw err;
  }
}

function connectionOptionsToMongoClientParams(
  connectionOptions: ConnectionOptions
): [string, MongoClientOptions] {
  const url = new ConnectionStringUrl(connectionOptions.connectionString);

  const options: MongoClientOptions = {
    monitorCommands: true,
  };

  // adds directConnection=true unless is explicitly a replica set
  const isLoadBalanced = url.searchParams.get('loadBalanced') === 'true';
  const isReplicaSet =
    url.isSRV || url.hosts.length > 1 || url.searchParams.has('replicaSet');

  if (!isReplicaSet && !isLoadBalanced) {
    url.searchParams.set('directConnection', 'true');
  }

  // See https://jira.mongodb.org/browse/NODE-3591
  if (
    !url.searchParams.has('tlsCertificateFile') &&
    url.searchParams.has('tlsCertificateKeyFile')
  ) {
    url.searchParams.set(
      'tlsCertificateFile',
      url.searchParams.get('tlsCertificateKeyFile') as string
    );
  }

  return [url.href, options];
}

async function resolveSrvRecord(url: string) {
  let resolvedUrl: string;
  try {
    resolvedUrl = await resolveMongodbSrv(url);
    log.info(mongoLogId(1_001_000_010), 'Connect', 'Resolved SRV record', {
      from: redactConnectionString(url),
      to: redactConnectionString(resolvedUrl),
    });
  } catch (error: any) {
    log.error(
      mongoLogId(1_001_000_011),
      'Connect',
      'Resolving SRV record failed',
      { from: redactConnectionString(url), error: error.message }
    );
    throw error;
  }
  return resolvedUrl;
}
