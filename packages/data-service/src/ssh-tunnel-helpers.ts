import type { ConnectionOptions } from './connection-options';
import type {
  DevtoolsProxyOptions,
  Tunnel,
} from '@mongodb-js/devtools-proxy-support';

export function waitForTunnelError(tunnel: Tunnel | undefined): {
  promise: Promise<never>;
  cancel: () => void;
} {
  let listener: ((err: Error) => void) | undefined;
  const promise = new Promise<never>((_, reject) => {
    listener = reject;
    tunnel?.on('error', listener);
  });
  return {
    promise,
    cancel: () => {
      if (listener) {
        (tunnel as NodeJS.EventEmitter | undefined)?.removeListener?.(
          'error',
          listener
        );
        listener = undefined;
      }
    },
  };
}

export function getTunnelOptions(
  connectionOptions: ConnectionOptions,
  appLevelProxyOptions: DevtoolsProxyOptions
): DevtoolsProxyOptions {
  if (connectionOptions.useApplicationLevelProxy) {
    return appLevelProxyOptions;
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
