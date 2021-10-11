import { EventEmitter, once } from 'events';
import createDebug from 'debug';
import fs from 'fs';

import ConnectionStringUrl from 'mongodb-connection-string-url';
import SSHTunnel from '@mongodb-js/ssh-tunnel';
import createLogger from '@mongodb-js/compass-logging';

import { ConnectionSshOptions } from './connection-options';
import { redactSshTunnelOptions } from './redact';

const debug = createDebug('mongodb-data-service:connect');
const { log, mongoLogId } = createLogger('COMPASS-CONNECT');

export async function openSshTunnel(
  srvResolvedConnectionString: string,
  sshTunnelOptions: ConnectionSshOptions | undefined,
  localPort: number
): Promise<[SSHTunnel | undefined, string]> {
  if (!sshTunnelOptions) {
    return [undefined, srvResolvedConnectionString];
  }

  const connectionStringUrl = new ConnectionStringUrl(
    srvResolvedConnectionString
  );

  if (connectionStringUrl.hosts.length !== 1) {
    throw new Error(
      'It is currently not possible to open an SSH tunnel to a replica set'
    );
  }

  const [dstHost, dstPort = 27017] = connectionStringUrl.hosts[0].split(':');

  const tunnelConstructorOptions = {
    readyTimeout: 20000,
    forwardTimeout: 20000,
    keepaliveInterval: 20000,
    srcAddr: '127.0.0.1', // OS should figure out an ephemeral srcPort.
    dstPort: dstPort,
    dstAddr: dstHost,
    localPort: localPort,
    localAddr: '127.0.0.1',
    host: sshTunnelOptions.host,
    port: sshTunnelOptions.port,
    username: sshTunnelOptions.username,
    password: sshTunnelOptions.password,
    privateKey: sshTunnelOptions.identityKeyFile
      ? await fs.promises.readFile(sshTunnelOptions.identityKeyFile)
      : undefined,
    passphrase: sshTunnelOptions.identityKeyPassphrase,
  };

  const redactedTunnelOptions = redactSshTunnelOptions(
    tunnelConstructorOptions
  );

  log.info(
    mongoLogId(1_001_000_006),
    'SSHTunnel',
    'Creating SSH tunnel',
    redactedTunnelOptions
  );

  debug('creating ssh tunnel with options', redactedTunnelOptions);

  const tunnel = new SSHTunnel(tunnelConstructorOptions);

  debug('ssh tunnel listen ...');
  await tunnel.listen();
  debug('ssh tunnel opened');

  log.info(mongoLogId(1_001_000_007), 'SSHTunnel', 'SSH tunnel opened');

  connectionStringUrl.hosts = [`127.0.0.1:${localPort}`];

  return [tunnel, connectionStringUrl.href];
}

export async function forceCloseTunnel(
  tunnelToClose?: SSHTunnel | void
): Promise<void> {
  if (tunnelToClose) {
    log.info(mongoLogId(1_001_000_008), 'SSHTunnel', 'Closing SSH tunnel');
    try {
      await tunnelToClose.close();
      debug('ssh tunnel stopped');
    } catch (err) {
      debug('ssh tunnel stopped with error', err);
    }
  }
}

export async function waitForTunnelError(
  tunnel: SSHTunnel | void
): Promise<void> {
  const [error] = await once(tunnel || new EventEmitter(), 'error');
  throw error;
}
