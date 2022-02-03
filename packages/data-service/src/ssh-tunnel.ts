import { EventEmitter, once } from 'events';
import createDebug from 'debug';
import fs from 'fs';
import crypto from 'crypto';
import { promisify } from 'util';

import SSHTunnel from '@mongodb-js/ssh-tunnel';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import type { MongoClientOptions } from 'mongodb';

import type { ConnectionSshOptions } from './connection-options';
import { redactSshTunnelOptions } from './redact';

const debug = createDebug('mongodb-data-service:connect');
const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-CONNECT');
const randomBytes = promisify(crypto.randomBytes);

type Socks5Options = Pick<
  MongoClientOptions,
  'proxyHost' | 'proxyPort' | 'proxyUsername' | 'proxyPassword'
>;

export async function openSshTunnel(
  sshTunnelOptions: ConnectionSshOptions | undefined
): Promise<[SSHTunnel | undefined, Socks5Options | undefined]> {
  if (!sshTunnelOptions) {
    return [undefined, undefined];
  }

  const credentialsSource = await randomBytes(64);
  const socks5Username = credentialsSource.slice(0, 32).toString('base64');
  const socks5Password = credentialsSource.slice(32).toString('base64');

  const tunnelConstructorOptions = {
    readyTimeout: 20000,
    forwardTimeout: 20000,
    keepaliveInterval: 20000,
    localPort: 0, // let the OS pick a port
    localAddr: '127.0.0.1',
    socks5Username: socks5Username,
    socks5Password: socks5Password,
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

  return [
    tunnel,
    {
      proxyHost: 'localhost',
      proxyPort: tunnel.config.localPort,
      proxyUsername: socks5Username,
      proxyPassword: socks5Password,
    },
  ];
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
): Promise<never> {
  const [error] = await once(tunnel || new EventEmitter(), 'error');
  throw error;
}
