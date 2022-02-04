import type { SshTunnelConfig } from '@mongodb-js/ssh-tunnel';
import type { ConnectionOptions } from './connection-options';
import { redactConnectionString } from 'mongodb-connection-string-url';
export { redactConnectionString };

export function redactConnectionOptions(
  options: ConnectionOptions
): ConnectionOptions {
  const redactedTunnelOptions = options.sshTunnel
    ? {
        ...options.sshTunnel,
      }
    : undefined;

  const redacted: ConnectionOptions = {
    ...options,
    sshTunnel: redactedTunnelOptions,
  };

  redacted.connectionString = redactConnectionString(options.connectionString);

  if (redacted.sshTunnel?.password) {
    redacted.sshTunnel.password = '<redacted>';
  }

  if (redacted.sshTunnel?.identityKeyPassphrase) {
    redacted.sshTunnel.identityKeyPassphrase = '<redacted>';
  }

  return redacted;
}

export function redactSshTunnelOptions<T extends Partial<SshTunnelConfig>>(
  options: T
): T {
  const redacted = { ...options };

  if (redacted.password) {
    redacted.password = '<redacted>';
  }

  if (redacted.privateKey) {
    redacted.privateKey = '<redacted>';
  }

  if (redacted.passphrase) {
    redacted.passphrase = '<redacted>';
  }

  return redacted;
}
