import type { ConnectionOptions } from './connection-options';
import type {
  DevtoolsProxyOptions,
  Tunnel,
} from '@mongodb-js/devtools-proxy-support';
import {
  defaultPreferencesInstance,
  proxyPreferenceToProxyOptions,
} from 'compass-preferences-model';

export async function waitForTunnelError(
  tunnel: Tunnel | undefined
): Promise<never> {
  return new Promise((_, reject) => {
    tunnel?.on('error', reject);
  });
}

export function getCurrentApplicationProxyOptions() {
  return proxyPreferenceToProxyOptions(
    defaultPreferencesInstance.getPreferences().proxy
  );
}

export function getTunnelOptions(
  connectionOptions: ConnectionOptions
): DevtoolsProxyOptions {
  if (connectionOptions.useApplicationLevelProxy) {
    return getCurrentApplicationProxyOptions();
  }
  if (connectionOptions.sshTunnel) {
    const {
      host,
      port,
      username,
      password,
      identityKeyFile,
      identityKeyPassphrase,
    } = connectionOptions.sshTunnel;
    return {
      proxy: `ssh://${
        username
          ? encodeURIComponent(username) +
            (password ? ':' + encodeURIComponent(password) : '') +
            '@'
          : ''
      }${encodeURIComponent(host)}:${encodeURIComponent(+port || 22)}`,
      sshOptions: { identityKeyFile, identityKeyPassphrase },
    };
  }
  return {};
}
