import { EventEmitter, once } from 'events';
import createDebug from 'debug';
import fs from 'fs';
import crypto from 'crypto';
import { promisify } from 'util';

import ConnectionStringUrl from 'mongodb-connection-string-url';
import SSHTunnel from '@mongodb-js/ssh-tunnel';
import createLogger from '@mongodb-js/compass-logging';
import type { Socks5Options } from 'mongodb';

import { ConnectionSshOptions } from './connection-options';
import { redactSshTunnelOptions } from './redact';

const debug = createDebug('mongodb-data-service:connect');
const { log, mongoLogId } = createLogger('COMPASS-CONNECT');
const randomBytes = promisify(crypto.randomBytes);

export async function openSshTunnel(
  srvResolvedConnectionString: string,
  sshTunnelOptions: ConnectionSshOptions | undefined,
  localPort: number
): Promise<[SSHTunnel | undefined, Socks5Options | undefined]> {
  if (!sshTunnelOptions) {
    return [undefined, undefined];
  }

  const socks5Username = (await randomBytes(32)).toString('base64');
  const socks5Password = (await randomBytes(32)).toString('base64');

  const tunnelConstructorOptions = {
    readyTimeout: 20000,
    forwardTimeout: 20000,
    keepaliveInterval: 20000,
    localPort: localPort,
    localAddr: '127.0.0.1',
    socks5Username: socks5Username,
    socks5Password: socks5Password,
    host: sshTunnelOptions.host,
    port: sshTunnelOptions.port,
    username: sshTunnelOptions.username,
    password: sshTunnelOptions.password,
    privateKey: sshTunnelOptions.identityKeyFile
      ? await fs.promises.readFile(
        Array.isArray(sshTunnelOptions.identityKeyFile) ?
          sshTunnelOptions.identityKeyFile[0] :
          sshTunnelOptions.identityKeyFile)
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

  return [tunnel, {
    host: `127.0.0.1:${localPort}`,
    username: socks5Username,
    password: socks5Password
  }];
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
