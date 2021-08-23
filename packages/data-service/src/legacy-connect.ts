import { EventEmitter, once } from 'events';

import { MongoClientOptions, MongoClient } from 'mongodb';
import SSHTunnel from '@mongodb-js/ssh-tunnel';
import ConnectionString from 'mongodb-connection-string-url';
import { redactSshTunnelOptions, redactConnectionString } from './redact';

import createDebug from 'debug';
import { LegacyConnectionModel } from './legacy-connection-model';

const debug = createDebug('mongodb-data-service:connect');

type ConnectReturnTuple = [
  MongoClient | void,
  SSHTunnel | null,
  { url: string; options: MongoClientOptions }
];

function removeGssapiServiceName(url: string) {
  const uri = new ConnectionString(url);
  uri.searchParams.delete('gssapiServiceName');
  return uri.toString();
}

async function openSshTunnel(model: LegacyConnectionModel) {
  if (
    !model.sshTunnel ||
    model.sshTunnel === 'NONE' ||
    !model.sshTunnelOptions
  ) {
    return null;
  }

  debug(
    'creating ssh tunnel with options',
    model.sshTunnel,
    redactSshTunnelOptions(model.sshTunnelOptions)
  );

  const tunnel = new SSHTunnel(model.sshTunnelOptions);

  debug('ssh tunnel listen ...');
  await tunnel.listen();
  debug('ssh tunnel opened');

  return tunnel;
}

async function forceCloseTunnel(tunnelToClose?: SSHTunnel | null) {
  if (tunnelToClose) {
    try {
      await tunnelToClose.close();
      debug('ssh tunnel stopped');
    } catch (err) {
      debug('ssh tunnel stopped with error: %s', err.message);
    }
  }
}

async function waitForTunnelError(tunnel: SSHTunnel | null) {
  const [error] = await once(tunnel || new EventEmitter(), 'error');
  throw error;
}

function addDirectConnectionWhenNeeded(
  options: MongoClientOptions,
  model: LegacyConnectionModel
): MongoClientOptions {
  if (
    model.directConnection === undefined &&
    model.hosts.length === 1 &&
    !model.isSrvRecord &&
    !model.loadBalanced &&
    (model.replicaSet === undefined || model.replicaSet === '')
  ) {
    return {
      ...options,
      directConnection: true,
    };
  }

  return options;
}

async function connect(
  model: LegacyConnectionModel,
  setupListeners: (client: MongoClient) => void
): Promise<ConnectReturnTuple> {
  debug('connecting ...');

  const url = removeGssapiServiceName(model.driverUrlWithSsh);
  const options = {
    ...addDirectConnectionWhenNeeded(model.driverOptions, model),
  };

  // if `auth` is passed then username and password must be present,
  // we remove this here as a safe-guard to make sure we don't get
  // an empty object that would break the connection.
  //
  // We could remove this line if we refactor connection model and we
  // have better control on what we get from it.
  //
  // NOTE: please redact the options in the debug output of this file
  // if we start to use `options.auth`.
  delete options.auth;

  /** @type {SSHTunnel} */
  const tunnel = await openSshTunnel(model);

  debug('creating MongoClient', {
    url: redactConnectionString(url),
    options,
  });

  const mongoClient = new MongoClient(url, options);

  if (setupListeners) {
    setupListeners(mongoClient);
  }

  try {
    debug('waiting for MongoClient to connect ...');
    const client = await Promise.race([
      mongoClient.connect(),
      waitForTunnelError(tunnel),
    ]);

    return [client, tunnel, { url, options }];
  } catch (err) {
    debug('connection error', err);
    debug('force shutting down ssh tunnel ...');
    await forceCloseTunnel(tunnel);
    throw err;
  }
}

export default function connectCallback(
  model: LegacyConnectionModel,
  setupListeners: (client: MongoClient) => void,
  done: (
    err: Error | null,
    client?: MongoClient | void,
    tunnel?: SSHTunnel | null,
    options?: { url: string; options: MongoClientOptions }
  ) => void
): void {
  connect(model, setupListeners).then(
    ([client, tunnel, options]) =>
      process.nextTick(() => done(null, client, tunnel, options)),
    (err) => process.nextTick(() => done(err))
  );
}
